import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    private s3Service: S3ImageStorageService,
  ) {}

  async create(createPostDto: CreatePostDto, user: User): Promise<Post> {
    const post = this.postsRepository.create({
      ...createPostDto,
      user: user,
    });

    return this.postsRepository.save(post);
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

    post.imagesUrl = [...(post.imagesUrl || []), ...imageUrls];
    return this.postsRepository.save(post);
}


  async update(id: number, updatePostDto: UpdatePostDto, imageFiles: Express.Multer.File[]): Promise<Post> {
    console.log(`Updating post with ID: ${id}`);
    const existingPost = await this.postsRepository.findOne({ where: { id } });
    if (!existingPost) throw new NotFoundException('Post not found');

    console.log('Existing post images:', existingPost.imagesUrl);

    const imageUrls = imageFiles.length > 0
      ? await Promise.all(
          imageFiles.map(file =>
            this.s3Service.uploadFile(file, `posts/${Date.now()}_${file.originalname}`)
          )
        )
      : existingPost.imagesUrl;

    console.log('Updated image URLs:', imageUrls);

    const updatedPost = this.postsRepository.create({
      ...existingPost,
      ...updatePostDto,
      imagesUrl: imageUrls,
    });

    return this.postsRepository.save(updatedPost);
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

  async uploadImages(imageFiles: Express.Multer.File[]): Promise<string[]> {
    const imageUrls = await Promise.all(
      imageFiles.map(file =>
        this.s3Service.uploadFile(file, `posts/${Date.now()}_${file.originalname}`)
      )
    );

    await this.postsRepository.save(imageUrls.map(url => ({ imagesUrl: [url] } as DeepPartial<Post>)));

    return imageUrls;
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
      queryBuilder.andWhere('post.description ILIKE :keywords', { keywords: `%${keywords}%` });
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
