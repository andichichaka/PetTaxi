import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { UsersService } from '../users/users.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post as PostEntity } from './post.entity';
import { PostResponseDto } from './dto/response/post.response.dto';
import { Location } from './location.entity';
import { AnimalSize } from './enum/animal-size.enum';
import { AnimalType } from './enum/animal-type.enum';
import { ServiceType } from './enum/service-type.enum';
import { User } from '../users/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../roles/roles.guard';

describe('PostsController', () => {
  let controller: PostsController;
  let postsService: jest.Mocked<PostsService>;
  let usersService: jest.Mocked<UsersService>;

  const mockUser = {
    id: 1,
    email: 'admin@pet.com',
    username: 'admin',
  };

  const mockLocation: Location = {
    id: 1,
    name: 'Sofia',
    posts: [],
  };

  const mockPost: PostEntity = {
    id: 1,
    description: 'mock desc',
    animalType: AnimalType.Dog,
    animalSizes: [AnimalSize.Small],
    user: mockUser as any,
    location: mockLocation,
    imagesUrl: ['https://bucket.s3.region.amazonaws.com/img.jpg'],
    reviews: [],
    services: [
      {
        id: 1,
        post: {} as any,
        serviceType: ServiceType.DailyWalking,
        price: 20,
        unavailableDates: [],
        bookings: [],
      },
    ],
  };

  beforeEach(async () => {
    postsService = {
      create: jest.fn(),
      addImagesToPost: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      searchPosts: jest.fn(),
      updatePostImages: jest.fn(),
      remove: jest.fn(),
      fetchLocations: jest.fn(),
    } as any;

    usersService = {
      findUserById: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        { provide: PostsService, useValue: postsService },
        { provide: UsersService, useValue: usersService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PostsController>(PostsController);
  });

  describe('createPost', () => {
    it('should call create on postsService with user and enum-cast DTO', async () => {
      const dto: CreatePostDto = {
        description: 'desc',
        animalType: AnimalType.Dog,
        animalSizes: [AnimalSize.Small],
        location: 1,
        services: [
          {
            serviceType: ServiceType.DailyWalking,
            price: 10,
            unavailableDates: [],
          },
        ],
      };

      const mockUser: User = {
        id: 1,
        email: 'admin@pet.com',
        username: 'admin',
        password: 'hashedpass',
        role: undefined,
        isEmailVerified: true,
        posts: [],
        bookings: [],
        codes: [],
        reviews: [],
      };

      usersService.findUserById.mockResolvedValue(mockUser);
      postsService.create.mockResolvedValue({
        id: 1,
        description: 'desc',
        animalType: AnimalType.Dog,
        animalSizes: [AnimalSize.Small],
        user: mockUser,
        location: mockLocation,
        services: [],
      });

      const result = await controller.createPost({ user: { sub: 1 } }, dto);

      expect(usersService.findUserById).toHaveBeenCalledWith(1);
      expect(postsService.create).toHaveBeenCalledWith(dto, mockUser);
      postsService.create.mockResolvedValue({
        id: 1,
        description: 'desc',
        animalType: AnimalType.Dog,
        animalSizes: [AnimalSize.Small],
        user: mockUser,
        location: mockLocation,
        services: [],
      });
    });
  });

  describe('addImagesToPost', () => {
    it('should call addImagesToPost', async () => {
      postsService.addImagesToPost.mockResolvedValue(mockPost);
      const result = await controller.addImagesToPost(1, []);
      expect(postsService.addImagesToPost).toHaveBeenCalledWith(1, []);
      expect(result).toEqual(mockPost);
    });
  });

  describe('updatePost', () => {
    it('should call update on service', async () => {
      const dto: UpdatePostDto = {
        description: 'updated',
        animalType: AnimalType.Cat,
        animalSizes: [AnimalSize.Medium],
        services: [
          {
            serviceType: ServiceType.WeeklySitting,
            price: 25,
            unavailableDates: [],
          },
        ],
      };

      postsService.update.mockResolvedValue(mockPost);
      const result = await controller.updatePost(1, dto);
      expect(postsService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(mockPost);
    });
  });

  describe('getAllPosts', () => {
    it('should return all posts', async () => {
      const posts: PostResponseDto[] = [{ ...mockPost }];
      postsService.findAll.mockResolvedValue(posts);
      const result = await controller.getAllPosts();
      expect(result).toEqual(posts);
    });
  });

  describe('searchPosts', () => {
    it('should call searchPosts with proper enums', async () => {
      postsService.searchPosts.mockResolvedValue([mockPost]);

      const result = await controller.searchPosts(
        'dog',
        [ServiceType.DailyWalking],
        AnimalType.Dog,
        [AnimalSize.Small],
        1
      );

      expect(postsService.searchPosts).toHaveBeenCalledWith(
        'dog',
        [ServiceType.DailyWalking],
        AnimalType.Dog,
        [AnimalSize.Small],
        1
      );
      expect(result).toEqual([mockPost]);
    });
  });

  describe('updatePostImages', () => {
    it('should call updatePostImages on service', async () => {
      postsService.updatePostImages.mockResolvedValue(mockPost);
      const result = await controller.updatePostImages(1, []);
      expect(result).toEqual(mockPost);
    });
  });

  describe('deletePost', () => {
    it('should call remove and return confirmation message', async () => {
      postsService.remove.mockResolvedValue();
      const result = await controller.deletePost(1);
      expect(result).toEqual({ message: 'Post successfully deleted.' });
    });
  });

  describe('getAllLocations', () => {
    it('should return list of locations', async () => {
      const locations = [mockLocation];
      postsService.fetchLocations.mockResolvedValue(locations);
      const result = await controller.getAllLocations();
      expect(result).toEqual(locations);
    });
  });
});