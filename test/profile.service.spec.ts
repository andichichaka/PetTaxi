import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from '../src/profile/profile.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/users/user.entity';
import { S3ImageStorageService } from '../src/image-storage/s3-image-storage.service';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException } from '@nestjs/common';
import { Role } from '../src/roles/enum/role.enum';
import { AnimalType } from '../src/posts/enum/animal-type.enum';
import { AnimalSize } from '../src/posts/enum/animal-size.enum';
import { ServiceType } from '../src/posts/enum/service-type.enum';

describe('ProfileService', () => {
  let service: ProfileService;
  let userRepo: jest.Mocked<Repository<User>>;
  let s3Service: jest.Mocked<S3ImageStorageService>;

  const mockUser: User = {
    id: 1,
    email: 'user@example.com',
    username: 'user',
    password: 'hashed',
    role: Role.User,
    isEmailVerified: true,
    profilePic: 'https://bucket.s3.region.amazonaws.com/profile.jpg',
    description: 'My bio',
    posts: [],
    bookings: [],
    codes: [],
    reviews: [],
  };

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      update: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
    } as any;

    s3Service = {
      uploadFile: jest.fn(),
      replaceFile: jest.fn(),
      deleteFile: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: S3ImageStorageService, useValue: s3Service },
        { provide: JwtService, useValue: {} },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  describe('getProfile', () => {
    it('should return profile DTO', async () => {
      userRepo.findOne.mockResolvedValue({
        ...mockUser,
        posts: [
          {
            id: 1,
            imagesUrl: ['img1'],
            description: 'desc',
            animalType: AnimalType.Dog,
            animalSizes: [AnimalSize.Medium],
            user: mockUser,
            location: { id: 1, name: 'Sofia', posts: [] },
            services: [
              {
                id: 1,
                serviceType: ServiceType.DailyWalking,
                price: 50,
                unavailableDates: [],
                bookings: [],
                post: {} as any,
              },
            ],
            reviews: [],
          },
        ],
      });

      const result = await service.getProfile(1);
      expect(result.id).toBe(1);
      expect(result.posts.length).toBe(1);
    });

    it('should throw if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.getProfile(123)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile and return DTO', async () => {
      userRepo.update.mockResolvedValue({} as any);
      userRepo.findOneBy.mockResolvedValue(mockUser);
      const result = await service.updateProfile(1, {
        username: 'newname',
        description: 'new bio',
        email: 'updated@example.com',
      });
      expect(result.email).toBe(mockUser.email);
    });
  });

  describe('uploadProfilePic', () => {
    it('should upload and save new profilePic', async () => {
      const file = { buffer: Buffer.from('data'), originalname: 'pic.jpg' } as any;
      userRepo.findOne.mockResolvedValue(mockUser);
      s3Service.uploadFile.mockResolvedValue('https://s3.new/pic.jpg');
      userRepo.save.mockResolvedValue({ ...mockUser, profilePic: 'https://s3.new/pic.jpg' });

      const result = await service.uploadProfilePic(1, file);
      expect(result).toContain('https://s3.new/pic.jpg');
    });

    it('should throw if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.uploadProfilePic(1, {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfilePicture', () => {
    it('should replace and update profilePic', async () => {
      const file = {} as any;
      const user = { ...mockUser, profilePic: 'https://s3.old/key.jpg' };
      userRepo.findOne.mockResolvedValue(user);
      s3Service.replaceFile.mockResolvedValue('https://s3.new/key.jpg');
      userRepo.save.mockResolvedValue({ ...user, profilePic: 'https://s3.new/key.jpg' });

      const result = await service.updateProfilePicture(1, file);
      expect(result.profilePic).toContain('https://s3.new/key.jpg');
    });

    it('should throw if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.updateProfilePicture(1, {} as any)).rejects.toThrow(NotFoundException);
    });
  });
});