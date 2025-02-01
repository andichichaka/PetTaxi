// import { Test, TestingModule } from '@nestjs/testing';
// import { PostsService } from '../src/posts/posts.service';
// import { getRepositoryToken } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Post } from '../src/posts/post.entity';
// import { User } from '../src/users/user.entity';
// import { IImageStorage } from '../src/image-storage/interfaces/image-storage.interface';
// import { Service } from 'aws-sdk';
// import { ServiceType } from 'src/posts/enum/service-type.enum';
// import { AnimalType } from 'src/posts/enum/animal-type.enum';
// import { AnimalSize } from 'src/posts/enum/animal-size.enum';

// type MockType<T> = {
//   [P in keyof T]?: jest.Mock<{}>;
// };

// describe('PostsService', () => {
//   let service: PostsService;
//   let mockPostsRepository: MockType<Repository<Post>>;
//   let mockImageStorage: MockType<IImageStorage>;
//   let mockUser: User;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         PostsService,
//         {
//           provide: getRepositoryToken(Post),
//           useValue: {
//             create: jest.fn(),
//             save: jest.fn(entity => Promise.resolve(entity)),
//           },
//         },
//         {
//           provide: 'IImageStorage',
//           useValue: {
//             saveImage: jest.fn().mockResolvedValue('/Users/andrey/Downloads/blankImage.jpg'),
//           }
//         },
//       ],
//     }).compile();

//     service = module.get<PostsService>(PostsService);
//     mockPostsRepository = module.get(getRepositoryToken(Post));
//     mockImageStorage = module.get('IImageStorage');

//     // Initialize mock user
//     mockUser = new User();
//     mockUser.id = 1;
//     mockUser.username = 'testUser';
//   });

//   it('should create a new post with user and images', async () => {
//     const createPostDto = {
//       description: 'A new post',
//       serviceType: ServiceType.Other,
//       animalType: AnimalType.Both,
//       animalSize: AnimalSize.Other,
//     };
//     const file = new File([""], "example.jpg");

//     const post = {
//       ...createPostDto,
//       user: mockUser,
//       imagesUrl: ['/Users/andrey/Downloads/blankImage.jpg'],
//     };

//     // Setup the repository mock to return the post
//     mockPostsRepository.create.mockReturnValue(post);
//     mockPostsRepository.save.mockResolvedValue(post);

//     const result = await service.create(createPostDto, mockUser, [file]);

//     expect(mockPostsRepository.create).toHaveBeenCalledWith({
//       ...createPostDto,
//       user: mockUser,
//       imagesUrl: ['path/to/image.jpg']
//     });
//     expect(mockPostsRepository.save).toHaveBeenCalled();
//     expect(result).toEqual(post);
//   });

//   // Additional tests for error handling and edge cases
// });
