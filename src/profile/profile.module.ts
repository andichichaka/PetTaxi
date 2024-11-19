// src/profile/profile.module.ts
import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/user.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [UsersModule, TypeOrmModule, AuthModule], // Import UsersModule to make UserRepository available
  providers: [ProfileService, User],
  controllers: [ProfileController]
})
export class ProfileModule {}
