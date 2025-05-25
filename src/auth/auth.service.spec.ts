import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Code } from '../users/code.entity';
import { EmailService } from '../email/email.service';
import { BadRequestException, HttpException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersRepo, mockCodesRepo;
  let usersService: Partial<UsersService>;
  let jwtService: Partial<JwtService>;
  let emailService: Partial<EmailService>;

  let testUser: User;

  beforeEach(async () => {
    testUser = {
      id: 1,
      email: 'a@a.com',
      username: 'test',
      password: await bcrypt.hash('pass', 10),
      role: 'user',
      isEmailVerified: true,
      posts: [],
      bookings: [],
      codes: [],
      reviews: [],
    } as User;

    mockUsersRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    };
    mockCodesRepo = {
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    usersService = {
      findUser: jest.fn(),
      findUserById: jest.fn(),
      createUser: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
      verify: jest.fn().mockReturnValue({ sub: 1 }),
    };
    emailService = {
      sendMail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: EmailService, useValue: emailService },
        { provide: getRepositoryToken(User), useValue: mockUsersRepo },
        { provide: getRepositoryToken(Code), useValue: mockCodesRepo },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('signIn()', () => {
    it('should login successfully', async () => {
      (usersService.findUser as jest.Mock).mockResolvedValue(testUser);
      jest.spyOn<any, any>(bcrypt, 'compare').mockResolvedValue(true);

      const result = await service.signIn('test', 'pass');
      expect(result.success).toBe(true);
      expect(result.access_token).toBeDefined();
      expect(result.refresh_token).toBeDefined();
    });

    it('should throw on wrong password', async () => {
      (usersService.findUser as jest.Mock).mockResolvedValue(testUser);
      jest.spyOn<any, any>(bcrypt, 'compare').mockResolvedValue(false);

      await expect(service.signIn('test', 'wrong')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if email not verified', async () => {
      const user = { ...testUser, isEmailVerified: false };
      (usersService.findUser as jest.Mock).mockResolvedValue(user);
      jest.spyOn<any, any>(bcrypt, 'compare').mockResolvedValue(true);

      await expect(service.signIn('test', 'pass')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signUp()', () => {
    it('should register and send verification email', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);
      const user = { ...testUser, isEmailVerified: false };
      (usersService.createUser as jest.Mock).mockResolvedValue(user);

      const result = await service.signUp(user.email, user.username, 'pass', user.role);
      expect(result.success).toBe(true);
      expect(emailService.sendMail).toHaveBeenCalled();
    });

    it('should delete unverified existing user', async () => {
      const user = { ...testUser, isEmailVerified: false };
      mockUsersRepo.findOne.mockResolvedValue(user);
      (usersService.createUser as jest.Mock).mockResolvedValue(user);

      await service.signUp(user.email, user.username, 'pass', user.role);
      expect(mockUsersRepo.delete).toHaveBeenCalledWith(user.id);
    });

    it('should throw if existing email is verified', async () => {
      mockUsersRepo.findOne.mockResolvedValue(testUser);
      await expect(service.signUp(testUser.email, testUser.username, 'pass', testUser.role)).rejects.toThrow(HttpException);
    });
  });

  describe('verifyEmail()', () => {
    it('should verify valid code', async () => {
      const code = { id: 1, code: '123456', expireAt: new Date(Date.now() + 10000) };
      const user = { ...testUser, isEmailVerified: false, codes: [code] };
      mockUsersRepo.findOne.mockResolvedValue(user);

      const result = await service.verifyEmail(user.email, '123456');
      expect(result.success).toBe(true);
      expect(mockCodesRepo.delete).toHaveBeenCalledWith({ id: code.id });
    });

    it('should throw if user not found', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);
      await expect(service.verifyEmail('x@x.com', '123')).rejects.toThrow(NotFoundException);
    });

    it('should throw if code expired or invalid', async () => {
      const expiredCode = { id: 2, code: '000000', expireAt: new Date(Date.now() - 1000) };
      const user = { ...testUser, codes: [expiredCode] };
      mockUsersRepo.findOne.mockResolvedValue(user);

      await expect(service.verifyEmail(user.email, '000000')).rejects.toThrow(BadRequestException);
    });
  });

  describe('refreshToken()', () => {
    it('should return a new access token', async () => {
      (usersService.findUserById as jest.Mock).mockResolvedValue(testUser);
      const result = await service.refreshToken('refresh-token');
      expect(result.access_token).toBe('signed-token');
    });

    it('should throw if user not found', async () => {
      (usersService.findUserById as jest.Mock).mockResolvedValue(null);
      await expect(service.refreshToken('invalid')).rejects.toThrow(BadRequestException);
    });

    it('should throw on jwt verification error', async () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('fail');
      });
      await expect(service.refreshToken('bad')).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyToken()', () => {
    it('should return valid if user exists', async () => {
      (usersService.findUserById as jest.Mock).mockResolvedValue(testUser);
      const result = await service.verifyToken('token');
      expect(result.valid).toBe(true);
    });

    it('should throw if user not found', async () => {
      (usersService.findUserById as jest.Mock).mockResolvedValue(null);
      await expect(service.verifyToken('invalid')).rejects.toThrow(BadRequestException);
    });
  });

  describe('setRole()', () => {
    it('should update role and return new tokens', async () => {
      mockUsersRepo.findOne.mockResolvedValue(testUser);
      mockUsersRepo.save.mockResolvedValue({ ...testUser, role: 'admin' });

      const result = await service.setRole(testUser.id, 'admin');
      expect(result.role).toBe('admin');
      expect(result.access_token).toBe('signed-token');
    });

    it('should throw if role is invalid', async () => {
      await expect(service.setRole(testUser.id, 'fake')).rejects.toThrow(NotFoundException);
    });

    it('should throw if user not found', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);
      await expect(service.setRole(99, 'user')).rejects.toThrow(NotFoundException);
    });
  });
});