import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { User } from 'src/users/user.entity';
import { S3ImageStorageService } from 'src/image-storage/s3-image-storage.service';
import { Service } from './entities/service.entity';
import { Location } from './entities/location.entity';
import { PostResponseDto } from './dto/response/post.response.dto';
import { PostCreateResponseDto } from './dto/response/post-create-response.dto';
import { ServiceType } from './enum/service-type.enum';
import { AnimalType } from './enum/animal-type.enum';
import { AnimalSize } from './enum/animal-size.enum';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
    private s3Service: S3ImageStorageService,
  ) {}

  async create(createPostDto: CreatePostDto, user: User): Promise<PostCreateResponseDto> {
    const { description, services, animalType, animalSizes, location } = createPostDto;
  
    const locationEntity = await this.locationRepository.findOne({ where: { id: location } });
    if (!locationEntity) throw new NotFoundException('Location not found');
  
    const post = this.postsRepository.create({
      description,
      animalType,
      animalSizes,
      user,
      location: locationEntity,
    });
  
    const savedPost = await this.postsRepository.save(post);
  
    const savedServices = await Promise.all(
      services.map(service =>
        this.servicesRepository.save({
          serviceType: service.serviceType,
          price: service.price,
          unavailableDates: service.unavailableDates || [],
          post: savedPost,
        })
      )
    );
  
    savedPost.services = savedServices;
  
    return {
      id: savedPost.id,
      description: savedPost.description,
      animalType: savedPost.animalType,
      animalSizes: savedPost.animalSizes,
      user: savedPost.user,
      location: savedPost.location,
      services: savedServices.map(s => ({
        id: s.id,
        bookings: s.bookings,
        serviceType: s.serviceType,
        price: s.price,
        unavailableDates: s.unavailableDates,
      })),
    };
  }

  async addImagesToPost(postId: number, imageFiles: Express.Multer.File[]): Promise<Post> {
    const post = await this.postsRepository.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const imageUrls = imageFiles.length
      ? await Promise.all(
          imageFiles.map(file =>
            this.s3Service.uploadFile(file, `post-images/${Date.now()}_${file.originalname}`),
          ),
        )
      : [];

    post.imagesUrl.push(...imageUrls);
    return this.postsRepository.save(post);
  }

async update(id: number, updatePostDto: UpdatePostDto): Promise<Post> {
  const existingPost = await this.postsRepository.findOne({
    where: { id },
    relations: ['services'],
  });
  if (!existingPost) throw new NotFoundException('Post not found');

  if (updatePostDto.services) {
    await this.servicesRepository.delete({ post: existingPost });

    const updatedServices = updatePostDto.services.map(serviceDto =>
      this.servicesRepository.create({
        ...serviceDto,
        post: existingPost,
      })
    );

    await this.servicesRepository.save(updatedServices);
  }

  let locationEntity = existingPost.location;
  if (updatePostDto.location) {
    locationEntity = updatePostDto.location;
    if (!locationEntity) throw new NotFoundException('Location not found');
  }

  const updatedPost = this.postsRepository.create({
    ...existingPost,
    ...updatePostDto,
    location: locationEntity,
  });

  return this.postsRepository.save(updatedPost);
}


  async updatePostImages(postId: number, files: Express.Multer.File[]): Promise<Post> {
    const post = await this.postsRepository.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    if (post.imagesUrl?.length) {
      for (const imageUrl of post.imagesUrl) {
        const key = this.extractS3Key(imageUrl);
        await this.s3Service.deleteFile(key);
      }
    }

    if (!files || files.length === 0) {
      await this.postsRepository
        .createQueryBuilder()
        .update(Post)
        .set({ imagesUrl: null })
        .where('id = :id', { id: postId })
        .execute();

      return this.postsRepository.findOne({ where: { id: postId } });
    }

    const imageUrls = await Promise.all(
      files.map((file, index) => {
        const newKey = `post-images/${postId}-${Date.now()}-${index}`;
        return this.s3Service.uploadFile(file, newKey);
      }),
    );

    await this.postsRepository
      .createQueryBuilder()
      .update(Post)
      .set({ imagesUrl: imageUrls })
      .where('id = :id', { id: postId })
      .execute();

    return this.postsRepository.findOne({ where: { id: postId } });
  }

  private extractS3Key(url: string): string {
    const bucketName = process.env.S3_BUCKET_NAME;
    const region = process.env.AWS_REGION;
    return url.replace(`https://${bucketName}.s3.${region}.amazonaws.com/`, '');
  }

  async remove(postId: number): Promise<void> {
    const post = await this.postsRepository.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    if (post.imagesUrl?.length) {
      for (const url of post.imagesUrl) {
        const key = this.extractS3Key(url);
        await this.s3Service.deleteFile(key);
      }
    }

    const result = await this.postsRepository.delete(postId);
    if (result.affected === 0) throw new NotFoundException('Post not found');
  }

  async findAll(): Promise<PostResponseDto[]> {
    const posts = await this.postsRepository.find({
      relations: ['services', 'user', 'location'],
    });

    return posts.map(post => ({
      id: post.id,
      imagesUrl: post.imagesUrl,
      description: post.description,
      animalType: post.animalType,
      animalSizes: post.animalSizes,
      user: post.user,
      location: post.location,
      services: post.services.map(({ post, ...service }) => service),
      reviews: post.reviews,
    }));
  }

  async searchPosts(
    keywords?: string,
    serviceTypes?: ServiceType[],
    animalType?: AnimalType,
    animalSizes?: AnimalSize[],
    locationId?: number,
  ): Promise<Post[]> {
    if (!keywords && !serviceTypes && !animalType && !animalSizes && !locationId) {
      throw new BadRequestException('At least one search filter must be provided.');
    }

    const queryBuilder = this.postsRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.services', 'service')
      .leftJoinAndSelect('post.location', 'location');

    queryBuilder.leftJoinAndSelect('post.services', 'allServices');

    if (keywords) {
      queryBuilder.andWhere('LOWER(post.description) LIKE :keywords', {
        keywords: `%${keywords.toLowerCase()}%`,
      });
    }

    if (serviceTypes?.length) {
      queryBuilder.andWhere(qb => {
        const subQuery = qb
          .subQuery()
          .select('service.postId')
          .from('service', 'service')
          .where('service.serviceType IN (:...serviceTypes)')
          .getQuery();

        return `post.id IN ${subQuery}`;
      }, { serviceTypes });
    }

    if (animalType) {
      queryBuilder.andWhere('post.animalType = :animalType', { animalType });
    }

    if (animalSizes?.length) {
      queryBuilder.andWhere('post.animalSizes && :animalSizes', { animalSizes });
    }

    if (locationId) {
      queryBuilder.andWhere('location.id = :locationId', { locationId });
    }

    return queryBuilder.getMany();
  }

  async fetchLocations(): Promise<Location[]> {
    return this.locationRepository.find({ order: { name: 'ASC' } });
  }
}