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
      services: savedServices.map((service) => ({
        id: service.id,
        bookings: service.bookings,
        serviceType: service.serviceType,
        price: service.price,
        unavailableDates: service.unavailableDates,
    })),
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
                this.s3Service.uploadFile(file, `post-images/${Date.now()}_${file.originalname}`)
            )
        )
        : [];

    post.imagesUrl.push(...imageUrls);
    return this.postsRepository.save(post);
}


async update(
  id: number,
  updatePostDto: UpdatePostDto,
): Promise<Post> {
  console.log(`Updating post with ID: ${id}`);

  const existingPost = await this.postsRepository.findOne({
    where: { id },
    relations: ['services'],
  });

  if (!existingPost) {
    throw new NotFoundException('Post not found');
  }

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
  });

  return this.postsRepository.save(updatedPost);
}

async updatePostImages(postId: number, files: Express.Multer.File[]): Promise<Post> {
  const post = await this.postsRepository.findOne({ where: { id: postId } });
  if (!post) {
    throw new NotFoundException('Post not found');
  }

  // Delete existing images from S3
  if (post.imagesUrl?.length) {
    for (const imageUrl of post.imagesUrl) {
      const key = this.extractS3Key(imageUrl);
      await this.s3Service.deleteFile(key);
    }
  }

  // 🔥 **Step 1: If no files, explicitly update DB to empty array**
  if (!files || files.length === 0) {
    console.log('No files provided. Removing all images from post.');

    // ✅ **Force TypeORM to update immediately**
    await this.postsRepository
      .createQueryBuilder()
      .update(Post)
      .set({ imagesUrl: [] }) // 🔥 **Explicitly setting imagesUrl to an empty array**
      .where("id = :id", { id: postId })
      .execute();

    console.log('Images removed. Fetching updated post...');

    // 🔥 **Step 2: Force re-fetch from DB (clears cache)**
    const updatedPost = await this.postsRepository.findOne({ where: { id: postId } });

    console.log('Updated Post (After Delete):', updatedPost);
    return updatedPost;
  }

  // 🔥 **Step 3: Upload new images**
  const imageUrls = await Promise.all(
    files.map((file, index) => {
      const newKey = `post-images/${postId}-${Date.now()}-${index}`;
      return this.s3Service.uploadFile(file, newKey);
    }),
  );

  // 🔥 **Step 4: Force TypeORM to update images with new ones**
  await this.postsRepository
    .createQueryBuilder()
    .update(Post)
    .set({ imagesUrl: imageUrls })
    .where("id = :id", { id: postId })
    .execute();

  // 🔥 **Step 5: Refetch the post to confirm update**
  const finalPost = await this.postsRepository.findOne({ where: { id: postId } });
  console.log('Final Updated Post:', finalPost);

  return finalPost;
}

private extractS3Key(url: string): string {
  const bucketName = process.env.S3_BUCKET_NAME;
  const region = process.env.AWS_REGION;
  return url.replace(`https://${bucketName}.s3.${region}.amazonaws.com/`, '');
}

async remove(postId: number): Promise<void> {
  console.log(`Removing post with ID: ${postId}`);
  const post = await this.postsRepository.findOne({ where: { id: postId } });

  if (!post) {
    throw new NotFoundException('Post not found');
  }

  if (post.imagesUrl?.length) {
    for (const url of post.imagesUrl) {
      const key = this.extractS3Key(url);
      await this.s3Service.deleteFile(key);
    }
  }

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

  async findAll(): Promise<PostResponseDto[]> {
    console.log('Fetching all posts...');

    const posts = await this.postsRepository.find({
        relations: ['services', 'user'],
    });

    console.log(`Found ${posts.length} posts.`);

    const response = posts.map((post) => ({
        id: post.id,
        imagesUrl: post.imagesUrl,
        description: post.description,
        animalType: post.animalType,
        animalSizes: post.animalSizes,
        user: post.user,
        services: post.services.map(({ post, ...service }) => service),
    }));

    return response;
}


async searchPosts(
  keywords?: string,
  serviceTypes?: ServiceType[],
  animalType?: AnimalType,
  animalSizes?: AnimalSize[]
): Promise<Post[]> {
  console.log('Searching posts with provided filters...');

  if(!keywords && !serviceTypes && !animalType && !animalSizes) {
      throw new BadRequestException('At least one search filter must be provided.');
  }

  const queryBuilder = this.postsRepository.createQueryBuilder('post');

  // Join the related tables
  queryBuilder
      .leftJoinAndSelect('post.user', 'user') // Include user details
      .leftJoinAndSelect('post.services', 'service'); // Include services

  // Filter by keywords in the post description
  if (keywords) {
      queryBuilder.andWhere('LOWER(post.description) LIKE :keywords', {
          keywords: `%${keywords.toLowerCase()}%`,
      });
  }

  // Filter by service types using the services table
  if (serviceTypes && serviceTypes.length > 0) {
      queryBuilder.andWhere('service.serviceType IN (:...serviceTypes)', {
          serviceTypes,
      });
  }

  // Filter by animal type
  if (animalType) {
      queryBuilder.andWhere('post.animalType = :animalType', {
          animalType,
      });
  }

  // Filter by animal sizes using PostgreSQL's array_overlap operator
  if (animalSizes && animalSizes.length > 0) {
      queryBuilder.andWhere(
          `post.animalSizes && :animalSizes::text[]`,
          { animalSizes: animalSizes } // Pass animalSizes as an array
      );
  }

  const posts = await queryBuilder.getMany();
  console.log(`Found ${posts.length} posts matching the criteria.`);
  return posts;
}

}
