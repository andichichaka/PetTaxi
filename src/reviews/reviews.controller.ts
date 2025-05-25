import { Controller, Post, Get, Delete, Param, Body, Req, } from '@nestjs/common';
import { ReviewService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { Roles } from 'src/roles/decorator/roles.decorator';
import { Role } from 'src/roles/enum/role.enum';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Roles(Role.User)
  @Post('create/:postId')
  async createReview(@Param('postId') postId: number, @Req() req, @Body() dto: CreateReviewDto) {
    return this.reviewService.createReview(req.user.sub, postId, dto);
  }

  @Get('get/:postId')
  async getReviews(@Param('postId') postId: number) {
    return this.reviewService.getReviewsForPost(postId);
  }

  @Delete(':reviewId')
  async deleteReview(@Param('reviewId') reviewId: number, @Req() req) {
    return this.reviewService.deleteReview(reviewId, req.user.sub);
  }
}