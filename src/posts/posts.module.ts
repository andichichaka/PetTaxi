import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { S3ImageStorageService } from 'src/image-storage/services/s3-image-storage.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './post.entity';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { JwtService } from '@nestjs/jwt';
import { Service } from './service.entity';

@Module({
  imports: [AuthModule, UsersModule, TypeOrmModule.forFeature([Post, Service])],
  providers: [JwtService, PostsService, S3ImageStorageService],
  controllers: [PostsController],
  exports: [PostsService, TypeOrmModule.forFeature([Post]), TypeOrmModule.forFeature([Service])],
})
export class PostsModule {}
