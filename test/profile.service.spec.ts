// import { Test, TestingModule } from '@nestjs/testing';
// import { ProfileService } from '../src/profile/profile.service';
// import { getRepositoryToken } from '@nestjs/typeorm';
// import { User } from '../src/users/user.entity';
// import { NotFoundException, InternalServerErrorException } from '@nestjs/common';

// describe('ProfileService', () => {
//   let service: ProfileService;
//   let mockUserRepository;

//   beforeEach(async () => {
//     mockUserRepository = {
//       findOneBy: jest.fn(),
//       save: jest.fn()
//     };

//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         ProfileService,
//         {
//           provide: getRepositoryToken(User),
//           useValue: mockUserRepository,
//         },
//       ],
//     }).compile();

//     service = module.get<ProfileService>(ProfileService);
//   });

//   describe('updateProfile', () => {
//     it('should throw NotFoundException if user not found', async () => {
//       mockUserRepository.findOneBy.mockResolvedValue(undefined);

//       await expect(service.updateProfile(1, {
//           email: 'new@example.com',
//           username: ''
//       }))
//         .rejects.toThrow(NotFoundException);
//     });

//     it('should update the user profile and return the updated user', async () => {
//       const user = { id: 1, email: 'old@example.com' };
//       const updatedUser = { id: 1, email: 'new@example.com' };

//       mockUserRepository.findOneBy.mockResolvedValue(user);
//       mockUserRepository.save.mockResolvedValue(updatedUser);

//       const result = await service.updateProfile(1, {
//           email: 'new@example.com',
//           username: ''
//       });
//       expect(result).toEqual(updatedUser);
//       expect(mockUserRepository.save).toHaveBeenCalledWith({...user, ...{ email: 'new@example.com' }});
//     });

//     it('should handle database errors during save', async () => {
//       mockUserRepository.findOneBy.mockResolvedValue({ id: 1, email: 'old@example.com' });
//       mockUserRepository.save.mockRejectedValue(new InternalServerErrorException());

//       await expect(service.updateProfile(1, {
//           email: 'new@example.com',
//           username: ''
//       }))
//         .rejects.toThrow(InternalServerErrorException);
//     });
//   });
// });
