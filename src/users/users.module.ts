// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User])  // Register the User entity
  ],
  providers: [UsersService],  // Provide the UsersService
  exports: [UsersService]  // Optionally export UsersService if it's used outside this module
})
export class UsersModule {}
