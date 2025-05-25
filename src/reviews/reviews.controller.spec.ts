import { Test, TestingModule } from '@nestjs/testing';
import { ReviewController } from './reviews.controller';
import { ReviewService } from './reviews.service';
import { Review } from './entities/review.entity';

describe('ReviewController', () => {
  let controller: ReviewController;
  let service: jest.Mocked<ReviewService>;

  const mockReview: Review = {
    id: 1,
    comment: 'Great job!',
    user: { id: 1 } as any,
    post: { id: 1 } as any,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    service = {
      createReview: jest.fn(),
      getReviewsForPost: jest.fn(),
      deleteReview: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewController],
      providers: [{ provide: ReviewService, useValue: service }],
    }).compile();

    controller = module.get<ReviewController>(ReviewController);
  });

  describe('createReview', () => {
    it('should call service with correct data', async () => {
      service.createReview.mockResolvedValue(mockReview);
      const result = await controller.createReview(1, { user: { sub: 1 } }, { comment: 'Great job!' });
      expect(service.createReview).toHaveBeenCalledWith(1, 1, { comment: 'Great job!' });
      expect(result).toEqual(mockReview);
    });
  });

  describe('getReviews', () => {
    it('should return reviews from service', async () => {
      service.getReviewsForPost.mockResolvedValue([mockReview]);
      const result = await controller.getReviews(1);
      expect(service.getReviewsForPost).toHaveBeenCalledWith(1);
      expect(result).toEqual([mockReview]);
    });
  });

  describe('deleteReview', () => {
    it('should call deleteReview with correct params', async () => {
      await controller.deleteReview(1, { user: { sub: 1 } });
      expect(service.deleteReview).toHaveBeenCalledWith(1, 1);
    });
  });
});