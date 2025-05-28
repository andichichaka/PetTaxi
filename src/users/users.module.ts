import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from 'src/roles/roles.guard';
import { CodesCleanupService } from '../utilities/codes-clean-up.service';
import { Code } from './code.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Code])],
  providers: [UsersService,
     {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    CodesCleanupService
  ],
  exports: [UsersService, TypeOrmModule.forFeature([User, Code])],
})
export class UsersModule {}
