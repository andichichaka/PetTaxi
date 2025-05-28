import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { S3ImageStorageService } from 'src/image-storage/s3-image-storage.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { JwtService } from '@nestjs/jwt';
import { Service } from './entities/service.entity';
import { Location } from './entities/location.entity'

@Module({
  imports: [AuthModule, UsersModule, TypeOrmModule.forFeature([Post, Service, Location])],
  providers: [JwtService, PostsService, S3ImageStorageService],
  controllers: [PostsController],
  exports: [PostsService, TypeOrmModule.forFeature([Post]), TypeOrmModule.forFeature([Service])],
})
export class PostsModule {}
