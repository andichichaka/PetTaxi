import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Role } from '../roles/enum/role.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../roles/roles.guard';

describe('ProfileController', () => {
  let controller: ProfileController;
  let service: jest.Mocked<ProfileService>;

  const mockUser = {
    id: 1,
    email: 'user@example.com',
    username: 'user',
    password: 'hashed',
    role: Role.User,
    isEmailVerified: true,
    posts: [],
    bookings: [],
    codes: [],
    reviews: [],
    profilePic: 'https://bucket.s3/pic.jpg',
  };

  beforeEach(async () => {
    service = {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      uploadProfilePic: jest.fn(),
      updateProfilePicture: jest.fn(),
    } as any;
  
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [{ provide: ProfileService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true }) // ✅ allow all
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true }) // ✅ allow all
      .compile();
  
    controller = module.get<ProfileController>(ProfileController);
  });

  it('should return user profile by token', async () => {
    service.getProfile.mockResolvedValue({
      id: 1,
      username: 'user',
      email: 'user@example.com',
      description: 'User description',
      profilePicture: 'https://bucket.s3/profile.jpg',
      posts: [],
    });
    const result = await controller.getProfile({ user: { sub: 1 } });
    expect(service.getProfile).toHaveBeenCalledWith(1);
    expect(result.username).toBe('user');
  });

  it('should return profile by param id', async () => {
    service.getProfile.mockResolvedValue({
      id: 2,
      username: 'another',
      email: 'user2@example.com',
      description: 'User description',
      profilePicture: 'https://bucket.s3/profile.jpg',
      posts: [],
    });
    const result = await controller.getUserProfileById(2);
    expect(service.getProfile).toHaveBeenCalledWith(2);
    expect(result.username).toBe('another');
  });

  it('should update profile info', async () => {
    const dto: UpdateProfileDto = { username: 'updated', description: 'new bio', email: 'user3@example.com', };
    service.updateProfile.mockResolvedValue({
      email: mockUser.email,
      username: dto.username,
      description: dto.description,
    });
    const result = await controller.updateProfile({ user: { sub: 1 } }, dto);
    expect(result.username).toBe('updated');
  });

  it('should upload profile pic', async () => {
    service.uploadProfilePic.mockResolvedValue('https://s3/profile.jpg');
    const result = await controller.uploadProfilePic({ user: { sub: 1 } }, {} as any);
    expect(result).toBe('https://s3/profile.jpg');
  });

  it('should update profile picture', async () => {
    service.updateProfilePicture.mockResolvedValue({
      ...mockUser,
      profilePic: 'https://s3/new.jpg',
    });
    const result = await controller.uploadProfilePicture({ user: { sub: 1 } }, {} as any);
    expect(result.profilePic).toBe('https://s3/new.jpg');
  });
});