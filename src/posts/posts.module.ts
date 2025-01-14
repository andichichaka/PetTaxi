import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { S3ImageStorageService } from 'src/image-storage/services/s3-image-storage.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './post.entity';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [AuthModule, UsersModule, TypeOrmModule.forFeature([Post])],
  providers: [JwtService, PostsService, S3ImageStorageService],
  controllers: [PostsController]
})
export class PostsModule {}
