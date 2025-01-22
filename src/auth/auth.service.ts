import { Injectable, UnauthorizedException, HttpException, HttpStatus, BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { In, Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { EmailService } from 'src/email/email.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Code } from 'src/users/code.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Code)
    private codesRepository: Repository<Code>,
    private emailService: EmailService,
  ) {}

  async signIn(username: string, password: string): Promise<any> {
    const user = await this.usersService.findUser(username);

    console.log(user);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid credentials',
      });
    }

    console.log(user.isEmailVerified);

    if (!user.isEmailVerified) {
      throw new UnauthorizedException({
        success: false,
        message: 'Email not verified. Please verify your email to continue.',
      });
    }

    const payload = { username: user.username, sub: user.id, roles: user.role };
    const token = await this.jwtService.signAsync(payload, { secret: process.env.JWT_SECRET });

    return {
      success: true,
      message: 'Login successful',
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    };
  }

  async signUp(email: string, username: string, password: string, role?: string): Promise<any> {
    const user = await this.usersService.createUser(email, username, password, role);

    if (!user) {
      throw new HttpException(
        {
          success: false,
          message: 'Username already taken or email already in use',
        },
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
      expireAt: new Date(Date.now() + 15 * 60 * 1000), // Expires in 15 minutes
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

  async verifyEmail(email: string, code: string): Promise<{ success: boolean; access_token: string; message: string }> {
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['codes'],
    });
  
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    const validCode = user.codes.find(
      (c) => c.code === code && new Date() <= c.expireAt,
    );
  
    if (!validCode) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    await this.codesRepository.delete({ id: validCode.id });
    user.isEmailVerified = true;
    await this.usersRepository.save(user);
  
    const payload = { username: user.username, sub: user.id, roles: user.role };
    const token = await this.jwtService.signAsync(payload, { secret: process.env.JWT_SECRET });
  
    return {
      success: true,
      access_token: token,
      message: 'Email verified successfully.',
    };
  }
  
}
