import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../roles/enum/role.enum';

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<Repository<User>>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedpass',
    role: Role.User,
    isEmailVerified: false,
    posts: [],
    bookings: [],
    codes: [],
    reviews: [],
    description: '',
    profilePic: '',
  };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('createUser()', () => {
    it('should return null if user exists and is verified', async () => {
      repo.findOne.mockResolvedValue({ ...mockUser, isEmailVerified: true });
      const result = await service.createUser('test@example.com', 'testuser', 'pass123', 'user');
      expect(result).toBeNull();
    });

    it('should create a user if not existing', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockImplementation((user: Partial<User>) => ({
        ...user,
        id: 2,
        email: user.email!,
        username: user.username!,
        password: user.password!,
        role: user.role!,
        isEmailVerified: false,
        description: '',
        profilePic: '',
        posts: [],
        bookings: [],
        codes: [],
        reviews: [],
      }));
      repo.save.mockImplementation(async (user: Partial<User>) => ({
        id: 2,
        email: user.email!,
        username: user.username!,
        password: user.password!,
        role: user.role!,
        isEmailVerified: false,
        description: '',
        profilePic: '',
        posts: [],
        bookings: [],
        codes: [],
        reviews: [],
      }));

      const hashedSpy = jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed123' as never);

      const result = await service.createUser('new@example.com', 'newuser', 'pass', 'admin');

      expect(repo.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        username: 'newuser',
        password: 'hashed123',
        role: Role.Admin,
      });
      expect(result?.id).toBe(2);
      expect(hashedSpy).toHaveBeenCalledWith('pass', 12);
    });
  });

  describe('findUser()', () => {
    it('should find user by username with selected fields', async () => {
      repo.findOne.mockResolvedValue(mockUser);
      const result = await service.findUser('testuser');
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
        select: ['id', 'username', 'email', 'password', 'role', 'isEmailVerified'],
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findUserById()', () => {
    it('should find user by ID', async () => {
      repo.findOne.mockResolvedValue(mockUser);
      const result = await service.findUserById(1);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockUser);
    });
  });
});