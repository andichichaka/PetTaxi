import { Module } from '@nestjs/common';
import { ReviewService } from './reviews.service';
import { ReviewController } from './reviews.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { Post } from 'src/posts/post.entity';
import { User } from 'src/users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, User, Review])],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [TypeOrmModule.forFeature([Review])],
})
export class ReviewsModule {}
