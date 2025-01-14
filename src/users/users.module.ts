// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from 'src/roles/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService,
     {
      provide: APP_GUARD,
      useClass: RolesGuard,
    }
  ],
  exports: [UsersService, TypeOrmModule.forFeature([User])]
})
export class UsersModule {}
