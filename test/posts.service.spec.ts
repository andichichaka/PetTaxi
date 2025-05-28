import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from '../src/posts/posts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, DeleteResult } from 'typeorm';
import { Post } from '../src/posts/entities/post.entity';
import { Service } from '../src/posts/entities/service.entity';
import { Location } from '../src/posts/entities/location.entity';
import { S3ImageStorageService } from '../src/image-storage/s3-image-storage.service';
import { CreatePostDto } from '../src/posts/dto/create-post.dto';
import { UpdatePostDto } from '../src/posts/dto/update-post.dto';
import { NotFoundException } from '@nestjs/common';
import { User } from '../src/users/user.entity';
import { ServiceType } from '../src/posts/enum/service-type.enum';
import { AnimalType } from '../src/posts/enum/animal-type.enum';
import { AnimalSize } from '../src/posts/enum/animal-size.enum';

describe('PostsService', () => {
  let service: PostsService;
  let postRepo: jest.Mocked<Repository<Post>>;
  let serviceRepo: jest.Mocked<Repository<Service>>;
  let locationRepo: jest.Mocked<Repository<Location>>;
  let s3Service: jest.Mocked<S3ImageStorageService>;

  const mockUser: User = {
    id: 1,
    email: 'user@example.com',
    username: 'test',
    password: '',
    role: undefined,
    isEmailVerified: true,
    posts: [],
    bookings: [],
    codes: [],
    reviews: [],
  };

  const mockLocation: Location = {
    id: 1,
    name: 'Sofia',
    posts: [],
  };

  const mockService: Service = {
    id: 1,
    post: {} as Post,
    serviceType: ServiceType.DailyWalking,
    price: 10,
    unavailableDates: [],
    bookings: [],
  };

  const mockPost: Post = {
    id: 1,
    description: 'test post',
    imagesUrl: [],
    location: mockLocation,
    user: mockUser,
    services: [mockService],
    reviews: [],
    animalType: AnimalType.Dog,
    animalSizes: [AnimalSize.Small],
  };

  const mockQB: Partial<SelectQueryBuilder<Post>> = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([mockPost]),
  };

  beforeEach(async () => {
    postRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQB as SelectQueryBuilder<Post>),
    } as any;

    serviceRepo = {
      save: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    } as any;

    locationRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    } as any;

    s3Service = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(Post), useValue: postRepo },
        { provide: getRepositoryToken(Service), useValue: serviceRepo },
        { provide: getRepositoryToken(Location), useValue: locationRepo },
        { provide: S3ImageStorageService, useValue: s3Service },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  describe('create()', () => {
    it('should throw if location is not found', async () => {
      locationRepo.findOne.mockResolvedValue(null);
      const dto: CreatePostDto = {
        description: '',
        animalType: AnimalType.Dog,
        animalSizes: [AnimalSize.Small],
        location: 99,
        services: [],
      };
      await expect(service.create(dto, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should create post and services', async () => {
      locationRepo.findOne.mockResolvedValue(mockLocation);
      const dto: CreatePostDto = {
        description: 'desc',
        animalType: AnimalType.Dog,
        animalSizes: [AnimalSize.Small],
        location: 1,
        services: [
          { serviceType: ServiceType.DailyWalking, price: 10, unavailableDates: [] },
        ],
      };

      postRepo.create.mockReturnValue(mockPost);
      postRepo.save.mockResolvedValue(mockPost);

      (serviceRepo.save as jest.Mock).mockImplementation(
        async (arg: any) => {
          if (Array.isArray(arg)) {
            return arg.map((s, i) => ({
              ...s,
              id: i + 1,
              post: mockPost,
              bookings: [],
              serviceType: s.serviceType,
              price: s.price,
              unavailableDates: s.unavailableDates || [],
            })) as Service[];
          }
          return {
            ...arg,
            id: 1,
            post: mockPost,
            bookings: [],
          } as Service;
        }
      );

      const result = await service.create(dto, mockUser);
      expect(result.id).toBe(mockPost.id);
      expect(result.services.length).toBe(1);
    });
  });

  describe('addImagesToPost()', () => {
    it('should throw if post not found', async () => {
      postRepo.findOne.mockResolvedValue(null);
      await expect(service.addImagesToPost(99, [])).rejects.toThrow(NotFoundException);
    });

    it('should add images to post', async () => {
      const file = { originalname: 'dog.jpg' } as Express.Multer.File;
      const updatedPost = { ...mockPost, imagesUrl: ['https://fake.s3/dog.jpg'] };

      postRepo.findOne.mockResolvedValue(mockPost);
      s3Service.uploadFile.mockResolvedValue('https://fake.s3/dog.jpg');
      postRepo.save.mockResolvedValue(updatedPost);

      const result = await service.addImagesToPost(1, [file]);
      expect(result.imagesUrl).toContain('https://fake.s3/dog.jpg');
    });
  });

  describe('update()', () => {
    it('should throw if post not found', async () => {
      postRepo.findOne.mockResolvedValue(null);
      await expect(service.update(1, {})).rejects.toThrow(NotFoundException);
    });

    it('should update and save post', async () => {
      const dto: UpdatePostDto = {
        description: 'Updated description',
        services: [
          {
            serviceType: ServiceType.DailySitting,
            price: 20,
            unavailableDates: [],
          },
        ],
      };

      const updatedServices: Service[] = dto.services.map((s, i) => ({
        id: i + 1,
        serviceType: s.serviceType!,
        price: s.price!,
        unavailableDates: s.unavailableDates || [],
        post: mockPost,
        bookings: [],
      }));
      
      (serviceRepo.save as jest.Mock).mockImplementation(
        async (arg: any) => {
          if (Array.isArray(arg)) {
            return arg.map((s, i) => ({
              ...s,
              id: i + 1,
              post: mockPost,
              bookings: [],
              serviceType: s.serviceType,
              price: s.price,
              unavailableDates: s.unavailableDates || [],
            })) as Service[];
          }
          return {
            ...arg,
            id: 1,
            post: mockPost,
            bookings: [],
          } as Service;
        }
      );
      const updatedPost: Post = {
        ...mockPost,
        ...dto,
        services: updatedServices,
      };

      postRepo.findOne.mockResolvedValue(mockPost);
      serviceRepo.delete.mockResolvedValue({ affected: 1, raw: {} } as DeleteResult);
      serviceRepo.create.mockImplementation((s: Partial<Service>) => ({
        id: Math.floor(Math.random() * 1000),
        serviceType: s.serviceType ?? ServiceType.DailyWalking,
        price: s.price ?? 0,
        unavailableDates: s.unavailableDates ?? [],
        bookings: [],
        post: s.post ?? mockPost,
      }));
      (serviceRepo.save as jest.Mock).mockImplementation(
        async (arg: any) => {
          if (Array.isArray(arg)) {
            return arg.map((s, i) => ({
              ...s,
              id: i + 1,
              post: mockPost,
              bookings: [],
              serviceType: s.serviceType,
              price: s.price,
              unavailableDates: s.unavailableDates || [],
            })) as Service[];
          }
          return {
            ...arg,
            id: 1,
            post: mockPost,
            bookings: [],
          } as Service;
        }
      );
      postRepo.create.mockReturnValue(updatedPost);
      postRepo.save.mockResolvedValue(updatedPost);

      const result = await service.update(1, dto);
      expect(result).toEqual(updatedPost);
    });
  });

  describe('remove()', () => {
    it('should throw if not found', async () => {
      postRepo.findOne.mockResolvedValue(null);
      await expect(service.remove(10)).rejects.toThrow(NotFoundException);
    });

    it('should delete images and remove post', async () => {
      const postWithImages = { ...mockPost, imagesUrl: ['url1'] };
      postRepo.findOne.mockResolvedValue(postWithImages);
      s3Service.deleteFile.mockResolvedValue();
      postRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

      await service.remove(1);
      expect(postRepo.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('findAll()', () => {
    it('should return all posts with relations', async () => {
      postRepo.find.mockResolvedValue([mockPost]);
      const result = await service.findAll();
      expect(result.length).toBe(1);
    });
  });

  describe('fetchLocations()', () => {
    it('should return sorted locations', async () => {
      locationRepo.find.mockResolvedValue([mockLocation]);
      const result = await service.fetchLocations();
      expect(result).toEqual([mockLocation]);
    });
  });

  describe('searchPosts()', () => {
    it('should throw if no filters provided', async () => {
      await expect(service.searchPosts()).rejects.toThrow();
    });

    it('should call queryBuilder and return results', async () => {
      const result = await service.searchPosts('desc');
      expect(result).toEqual([mockPost]);
    });
  });
});