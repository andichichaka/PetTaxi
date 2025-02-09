import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

describe('AuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: Partial<JwtService>;

  beforeEach(async () => {
    jwtService = {
      verifyAsync: jest.fn().mockResolvedValue({ userId: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });
});
