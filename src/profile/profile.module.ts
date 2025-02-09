import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [UsersModule, TypeOrmModule, AuthModule],
  providers: [JwtService, ProfileService, User],
  controllers: [ProfileController]
})
export class ProfileModule {}
