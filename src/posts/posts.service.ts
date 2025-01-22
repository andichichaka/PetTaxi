import { BadRequestException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Post } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { User } from 'src/users/user.entity';
import { S3ImageStorageService } from 'src/image-storage/services/s3-image-storage.service';
import { ServiceType } from './enum/service-type.enum';
import { AnimalType } from './enum/animal-type.enum';
import { AnimalSize } from './enum/animal-size.enum';
import { Service } from './service.entity';
import { plainToClass } from 'class-transformer';
import { PostResponseDto } from './dto/post.response.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
    private s3Service: S3ImageStorageService,
  ) {}

async create(createPostDto: CreatePostDto, user: User): Promise<any> {
    const { description, services, animalType, animalSizes } = createPostDto;

    const post = this.postsRepository.create({
        description,
        animalType,
        animalSizes,
        user,
    });

    const savedPost = await this.postsRepository.save(post);

    const savedServices = await Promise.all(
        services.map((service) =>
            this.servicesRepository.save({
                serviceType: service.serviceType,
                price: service.price,
                unavailableDates: service.unavailableDates || [],
                post: savedPost,
            }),
        ),
    );

    savedPost.services = savedServices;

    const response: PostResponseDto = {
      id: savedPost.id,
      description: savedPost.description,
      animalType: savedPost.animalType,
      animalSizes: savedPost.animalSizes,
      user: savedPost.user,
      services: savedServices.map(({ post, ...service }) => service),
  };

  return response;
}

 
  async addImagesToPost(postId: number, imageFiles: Express.Multer.File[]): Promise<Post> {
    const post = await this.postsRepository.findOne({ where: { id: postId } });
    if (!post) {
        throw new NotFoundException('Post not found');
    }

    const imageUrls = imageFiles.length > 0
        ? await Promise.all(
            imageFiles.map(file =>
                this.s3Service.uploadFile(file, `posts/${Date.now()}_${file.originalname}`)
            )
        )
        : [];

    post.imagesUrl.push(...imageUrls);
    return this.postsRepository.save(post);
}


async update(
  id: number,
  updatePostDto: UpdatePostDto,
  imageFiles: Express.Multer.File[],
): Promise<Post> {
  console.log(`Updating post with ID: ${id}`);

  const existingPost = await this.postsRepository.findOne({
    where: { id },
    relations: ['services'],
  });

  if (!existingPost) {
    throw new NotFoundException('Post not found');
  }

  console.log('Existing post:', existingPost);

  const updatedImageUrls = await Promise.all(
    imageFiles.map((file, index) => {
      const oldKey = existingPost.imagesUrl[index]
        ? this.extractS3Key(existingPost.imagesUrl[index])
        : null;
      const newKey = `posts/${id}-${Date.now()}-${file.originalname}`;

      return this.s3Service.replaceFile(oldKey, file, newKey);
    }),
  );

  console.log('Updated image URLs:', updatedImageUrls);

  if (updatePostDto.services) {
    await this.servicesRepository.delete({ post: existingPost });

    const updatedServices = updatePostDto.services.map((serviceDto) =>
      this.servicesRepository.create({
        ...serviceDto,
        post: existingPost,
      }),
    );

    await this.servicesRepository.save(updatedServices);
  }

  const updatedPost = this.postsRepository.create({
    ...existingPost,
    ...updatePostDto,
    imagesUrl: updatedImageUrls.length > 0 ? updatedImageUrls : existingPost.imagesUrl, // Retain existing images if none are provided
  });

  return this.postsRepository.save(updatedPost);
}

private extractS3Key(url: string): string {
  const bucketName = process.env.S3_BUCKET_NAME;
  const region = process.env.AWS_REGION;
  return url.replace(`https://${bucketName}.s3.${region}.amazonaws.com/`, '');
}



  async remove(postId: number): Promise<void> {
    console.log(`Removing post with ID: ${postId}`);
    const result = await this.postsRepository.delete(postId);
    if (result.affected === 0) {
      throw new NotFoundException('Post not found');
    }
    console.log(`Post with ID: ${postId} successfully removed.`);
  }

  async findOne(id: number): Promise<Post> {
    console.log(`Fetching post with ID: ${id}`);
    const post = await this.postsRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  async findAll(): Promise<Post[]> {
    console.log('Fetching all posts...');
    const posts = await this.postsRepository.find({
      relations: ['user'],
    });
    console.log(`Found ${posts.length} posts.`);
    return posts;
  }

  async searchPosts(
    keywords?: string, 
    serviceTypes?: ServiceType[], 
    animalType?: AnimalType, 
    animalSizes?: AnimalSize[]
  ): Promise<Post[]> {
    console.log('Searching posts with provided filters...');
  
    const queryBuilder = this.postsRepository.createQueryBuilder('post');
  
    // Include related user entity if necessary
    queryBuilder.leftJoinAndSelect('post.user', 'user');
  
    // Filter by keywords in description
    if (keywords) {
      queryBuilder.andWhere('LOWER(post.description) LIKE :keywords', { keywords: `%${keywords.toLowerCase()}%` });
  }
  
    // Filter by service types
    if (serviceTypes && serviceTypes.length > 0) {
      queryBuilder.andWhere('post.serviceTypes && :serviceTypes', { serviceTypes });
    }
  
    // Filter by animal type
    if (animalType) {
      queryBuilder.andWhere('post.animalType = :animalType', { animalType });
    }
  
    // Filter by animal sizes
    if (animalSizes && animalSizes.length > 0) {
      queryBuilder.andWhere('post.animalSizes && :animalSizes', { animalSizes });
    }
  
    // Execute the query
    const posts = await queryBuilder.getMany();
    console.log(`Found ${posts.length} posts matching the criteria.`);
    return posts;
  }
  
}
