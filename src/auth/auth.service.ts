import { Injectable, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async signIn(username: string, password: string): Promise<any> {
    const user = await this.usersService.findUser(username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid credentials',
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

    const payload = { username: user.username, sub: user.id, roles: user.role };
    const token = await this.jwtService.signAsync(payload, { secret: process.env.JWT_SECRET });
    console.log(token);

    return {
      success: true,
      message: 'User registered successfully',
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    };
  }
}
