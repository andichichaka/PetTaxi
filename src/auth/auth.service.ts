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

  async signIn(username: string, password: string): Promise<{ access_token: string }> {
    const user = await this.usersService.findUser(username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: await this.jwtService.signAsync(payload, {secret: process.env.JWT_SECRET}),
    };
  }

  async signUp(email: string, username: string, password: string): Promise<any> {
    const user = await this.usersService.createUser(email, username, password);
    if (!user) {
      throw new HttpException('Username already taken or email alredy in use', HttpStatus.BAD_REQUEST);
    }
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: await this.jwtService.signAsync(payload, {secret: process.env.JWT_SECRET}),
    };
  }
}
