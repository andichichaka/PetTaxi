import { Test, TestingModule } from '@nestjs/testing';
import { ReviewController } from './reviews.controller';
import { ReviewService } from './reviews.service';

describe('ReviewsController', () => {
  let controller: ReviewController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewController],
      providers: [ReviewService],
    }).compile();

    controller = module.get<ReviewController>(ReviewController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
