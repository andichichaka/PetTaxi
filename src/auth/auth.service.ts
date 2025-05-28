import {
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { EmailService } from '../utilities/email.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Code } from '../users/code.entity';
import { Role } from '../roles/enum/role.enum';
import { LoginResponseDto } from './dto/response/login-response.dto';
import { SignupResponseDto } from './dto/response/signup-response.dto';
import { EmailVerifyResponseDto } from './dto/response/email-verify-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(Code) private codesRepository: Repository<Code>,
    private emailService: EmailService,
  ) {}

  async signIn(username: string, password: string): Promise<LoginResponseDto> {
    const user = await this.usersService.findUser(username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException({
        success: false,
        message: 'Email not verified. Please verify your email to continue.',
      });
    }

    const tokens = await this.generateTokens(user);

    return {
      success: true,
      message: 'Login successful',
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    };
  }

  async signUp(
    email: string,
    username: string,
    password: string,
    role?: string,
  ): Promise<SignupResponseDto> {
    const existingUser = await this.usersRepository.findOne({ where: { email } });

    if (existingUser) {
      if (existingUser.isEmailVerified) {
        throw new HttpException('Email already in use', HttpStatus.BAD_REQUEST);
      }
      await this.usersRepository.delete(existingUser.id);
    }

    const user = await this.usersService.createUser(email, username, password, role);

    if (!user) {
      throw new HttpException(
        { success: false, message: 'Username already taken or email already in use' },
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.sendVerificationEmail(user);

    return {
      success: true,
      message: 'User registered successfully. Please verify your email to continue.',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    };
  }

  async sendVerificationEmail(user: User): Promise<void> {
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const code = this.codesRepository.create({
      code: verificationCode,
      expireAt: new Date(Date.now() + 15 * 60 * 1000),
      user,
    });

    await this.codesRepository.save(code);

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #007bff; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Welcome to PetTaxi!</h1>
        <p style="margin: 5px 0;">Verify your email to activate your account</p>
      </div>
      <div style="padding: 20px; text-align: center;">
        <p style="font-size: 16px; margin: 10px 0;">Your email verification code is:</p>
        <p style="font-size: 28px; font-weight: bold; color: #007bff; margin: 20px 0;">${verificationCode}</p>
        <p style="font-size: 14px; margin: 20px 0; color: #6c757d;">This code is valid for 15 minutes. If you didn’t sign up, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6c757d;">PetTaxi Team</p>
      </div>
    </div>
    `;

    await this.emailService.sendMail({
      to: user.email,
      subject: 'Verify Your Email - PetTaxi',
      html: htmlContent,
    });
  }

  async verifyEmail(email: string, code: string): Promise<EmailVerifyResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['codes'],
    });

    if (!user) throw new NotFoundException('User not found');

    const validCode = user.codes.find(c => c.code === code && new Date() <= c.expireAt);

    if (!validCode) throw new BadRequestException('Invalid or expired verification code');

    await this.codesRepository.delete({ id: validCode.id });

    user.isEmailVerified = true;
    await this.usersRepository.save(user);

    const tokens = await this.generateTokens(user);

    return {
      success: true,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      message: 'Email verified successfully.',
    };
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersService.findUserById(payload.sub);

      if (!user) throw new BadRequestException('Invalid refresh token');

      const accessToken = this.jwtService.sign(
        { username: user.username, sub: user.id, roles: user.role },
        { expiresIn: '2d' },
      );

      return { access_token: accessToken };
    } catch {
      throw new BadRequestException('Invalid or expired refresh token');
    }
  }

  async verifyToken(accessToken: string): Promise<{ valid: boolean }> {
    try {
      const payload = this.jwtService.verify(accessToken);
      const user = await this.usersService.findUserById(payload.sub);

      if (!user) throw new BadRequestException('Invalid token');

      return { valid: true };
    } catch {
      throw new BadRequestException('Invalid or expired access token');
    }
  }

  async setRole(id: number, role: string): Promise<any> {
    const validRole = this.validateRole(role);
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    user.role = validRole;
    const newUser = await this.usersRepository.save(user);
    const tokens = await this.generateTokens(newUser);

    return {
      id: newUser.id,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      username: newUser.email,
      email: newUser.username,
      role: newUser.role,
    };
  }

  private validateRole(role: string): Role {
    if (!Object.values(Role).includes(role as Role)) {
      throw new NotFoundException(`Invalid role: ${role}`);
    }
    return role as Role;
  }

  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { username: user.username, sub: user.id, roles: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '2d' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });
    return { accessToken, refreshToken };
  }
}