import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { SignUpDTO } from './dto/sign-up.dto';
import { BadRequestException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: Partial<Record<keyof AuthService, jest.Mock>>;

  beforeEach(async () => {
    mockAuthService = {
      signIn: jest.fn(),
      signUp: jest.fn(),
      refreshToken: jest.fn(),
      verifyEmail: jest.fn(),
      verifyToken: jest.fn(),
      setRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('signIn()', () => {
    it('should return login response', async () => {
      const dto: LoginDTO = {
        username: 'test',
        password: 'pass',
        email: 'a@a.com'
      };
      const response = { access_token: 'access', refresh_token: 'refresh', success: true, message: 'ok', user: {} };
      mockAuthService.signIn.mockResolvedValue(response);

      await expect(controller.signIn(dto)).resolves.toEqual(response);
      expect(mockAuthService.signIn).toHaveBeenCalledWith('test', 'pass');
    });
  });

  describe('signUp()', () => {
    it('should return signup response', async () => {
      const dto: SignUpDTO = { email: 'a@a.com', username: 'test', password: 'pass', role: 'user' };
      const response = { success: true, message: 'created', user: {} };
      mockAuthService.signUp.mockResolvedValue(response);

      await expect(controller.signUp(dto)).resolves.toEqual(response);
      expect(mockAuthService.signUp).toHaveBeenCalledWith('a@a.com', 'test', 'pass', 'user');
    });

    it('should default to user role if none provided', async () => {
      const dto = { email: 'a@a.com', username: 'test', password: 'pass' };
      mockAuthService.signUp.mockResolvedValue({ success: true, message: '', user: {} });

      await controller.signUp(dto as SignUpDTO);
      expect(mockAuthService.signUp).toHaveBeenCalledWith('a@a.com', 'test', 'pass', 'user');
    });
  });

  describe('refresh()', () => {
    it('should return new access token', async () => {
      const token = 'refreshToken';
      const result = { access_token: 'newAccess' };
      mockAuthService.refreshToken.mockResolvedValue(result);
  
      await expect(controller.refresh({ refresh_token: token })).resolves.toEqual(result);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(token);
    });
  
    it('should throw BadRequestException if token is missing', async () => {
      try {
        await controller.refresh({ refresh_token: '' });
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe('Refresh token is required');
      }
    });
  });

  describe('verifyEmail()', () => {
    it('should call verifyEmail and return response', async () => {
      const email = 'a@a.com';
      const code = '123456';
      const result = { success: true, message: '', access_token: '', refresh_token: '' };
      mockAuthService.verifyEmail.mockResolvedValue(result);

      await expect(controller.verifyEmail(email, code)).resolves.toEqual(result);
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(email, code);
    });
  });
  
  describe('verify()', () => {
    it('should call verifyToken and return validity', async () => {
      const token = 'accessToken';
      const result = { valid: true };
      mockAuthService.verifyToken.mockResolvedValue(result);
  
      await expect(controller.verify({ access_token: token })).resolves.toEqual(result);
      expect(mockAuthService.verifyToken).toHaveBeenCalledWith(token);
    });
  
    it('should throw BadRequestException if token is missing', async () => {
      try {
        await controller.verify({ access_token: '' });
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe('Access token is required');
      }
    });
  });

  describe('setRole()', () => {
    it('should call setRole with user id and role', async () => {
      const mockRequest = { user: { sub: 123 } };
      mockAuthService.setRole.mockResolvedValue({ role: 'admin' });

      const result = await controller.setRole(mockRequest, 'admin');
      expect(result).toEqual({ role: 'admin' });
      expect(mockAuthService.setRole).toHaveBeenCalledWith(123, 'admin');
    });
  });
});