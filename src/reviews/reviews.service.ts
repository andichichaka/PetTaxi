import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Post } from '../posts/entities/post.entity';
import { User } from '../users/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createReview(userId: number, postId: number, dto: CreateReviewDto): Promise<Review> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const review = this.reviewRepository.create({
      comment: dto.comment,
      user,
      post,
    });

    return this.reviewRepository.save(review);
  }

  async getReviewsForPost(postId: number): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { post: { id: postId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async deleteReview(reviewId: number, userId: number): Promise<void> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['user'],
    });

    if (!review) throw new NotFoundException('Review not found');
    if (review.user.id !== userId) throw new NotFoundException('Unauthorized');

    await this.reviewRepository.delete(reviewId);
  }
}