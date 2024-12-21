import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { User } from 'src/users/user.entity';
import { S3ImageStorageService } from 'src/image-storage/services/s3-image-storage.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    private s3Service: S3ImageStorageService,
  ) {}

  async create(createPostDto: CreatePostDto, user: User, imageFiles?: Express.Multer.File[]): Promise<Post> {
    const imageUrls = imageFiles
      ? await Promise.all(
          imageFiles.map(file => this.s3Service.uploadFile(file, `posts/${Date.now()}_${file.originalname}`))
        )
      : [];

    const post = this.postsRepository.create({
      ...createPostDto,
      user: user,
      imagesUrl: imageUrls,
    });

    return this.postsRepository.save(post);
  }

  async update(id: number, updatePostDto: UpdatePostDto, imageFiles: Express.Multer.File[]): Promise<Post> {
    const existingPost = await this.postsRepository.findOne({ where: { id } });
    if (!existingPost) throw new NotFoundException('Post not found');

    const imageUrls = imageFiles && imageFiles.length > 0
      ? await Promise.all(
          imageFiles.map(file => this.s3Service.uploadFile(file, `posts/${Date.now()}_${file.originalname}`))
        )
      : existingPost.imagesUrl;

    const updatedPost = this.postsRepository.create({
      ...existingPost,
      ...updatePostDto,
      imagesUrl: imageUrls,
    });

    return this.postsRepository.save(updatedPost);
  }

  async remove(postId: number): Promise<void> {
    const result = await this.postsRepository.delete(postId);
    if (result.affected === 0) {
      throw new NotFoundException('Post not found');
    }
  }

  async findOne(id: number): Promise<Post> {
    const post = await this.postsRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }
}
