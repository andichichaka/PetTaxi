import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from './reviews.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Post } from '../posts/post.entity';
import { User } from '../users/user.entity';
import { NotFoundException } from '@nestjs/common';

describe('ReviewService', () => {
  let service: ReviewService;
  let reviewRepo: jest.Mocked<Repository<Review>>;
  let postRepo: jest.Mocked<Repository<Post>>;
  let userRepo: jest.Mocked<Repository<User>>;

  const mockUser: User = {
    id: 1,
    email: 'user@test.com',
    username: 'testuser',
    password: 'hash',
    role: undefined,
    isEmailVerified: true,
    description: '',
    profilePic: '',
    posts: [],
    bookings: [],
    codes: [],
    reviews: [],
  };

  const mockPost: Post = {
    id: 1,
    description: 'test post',
    imagesUrl: [],
    animalType: 'dog' as any,
    animalSizes: [],
    location: {} as any,
    user: mockUser,
    services: [],
    reviews: [],
  };

  beforeEach(async () => {
    reviewRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    } as any;

    postRepo = { findOne: jest.fn() } as any;
    userRepo = { findOne: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        { provide: getRepositoryToken(Review), useValue: reviewRepo },
        { provide: getRepositoryToken(Post), useValue: postRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
  });

  describe('createReview', () => {
    it('should throw if post not found', async () => {
      postRepo.findOne.mockResolvedValue(null);
      await expect(service.createReview(1, 1, { comment: 'test' })).rejects.toThrow(NotFoundException);
    });

    it('should throw if user not found', async () => {
      postRepo.findOne.mockResolvedValue(mockPost);
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.createReview(1, 1, { comment: 'test' })).rejects.toThrow(NotFoundException);
    });

    it('should create and save review', async () => {
      postRepo.findOne.mockResolvedValue(mockPost);
      userRepo.findOne.mockResolvedValue(mockUser);
      const review = { id: 1, comment: 'Great', user: mockUser, post: mockPost, createdAt: new Date(), };
      reviewRepo.create.mockReturnValue(review);
      reviewRepo.save.mockResolvedValue(review);

      const result = await service.createReview(mockUser.id, mockPost.id, { comment: 'Great' });
      expect(result).toEqual(review);
      expect(reviewRepo.create).toHaveBeenCalled();
    });
  });

  describe('getReviewsForPost', () => {
    it('should return list of reviews', async () => {
      const reviews = [{ id: 1, comment: 'Nice', user: mockUser, post: mockPost }];
      reviewRepo.find.mockResolvedValue(reviews as any);
      const result = await service.getReviewsForPost(1);
      expect(result).toEqual(reviews);
    });
  });

  describe('deleteReview', () => {
    it('should throw if review not found', async () => {
      reviewRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteReview(1, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw if user is not the author', async () => {
      const review = { id: 1, user: { id: 2 } };
      reviewRepo.findOne.mockResolvedValue(review as any);
      await expect(service.deleteReview(1, 1)).rejects.toThrow(NotFoundException);
    });

    it('should delete review if user is the author', async () => {
      const review = { id: 1, user: { id: 1 } };
      reviewRepo.findOne.mockResolvedValue(review as any);
      await service.deleteReview(1, 1);
      expect(reviewRepo.delete).toHaveBeenCalledWith(1);
    });
  });
});