import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { User } from './users/user.entity';
import { Post } from './posts/post.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProfileController } from './profile/profile.controller';
import { ProfileService } from './profile/profile.service';
import { ProfileModule } from './profile/profile.module';
import { AuthController } from './auth/auth.controller';
import { PostsModule } from './posts/posts.module';
import { ImageStorageModule } from './image-storage/image-storage.module';
import { S3ImageStorageService } from './image-storage/services/s3-image-storage.service';
import { JwtService } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './roles/roles.guard';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 1000),
        username: process.env.PS_USER,
        password: String(process.env.PS_PASS),
        database: process.env.PS_DB,
        entities: [User, Post],
        synchronize: true,
      })
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ProfileModule,
    PostsModule,
    ImageStorageModule,
  ],
  controllers: [AppController, ProfileController, AuthController],
  providers: [{
    provide: APP_GUARD,
    useClass: JwtAuthGuard, // Global AuthGuard
  },
  {
    provide: APP_GUARD,
    useClass: RolesGuard, // Global RolesGuard
  },JwtService, AppService, ProfileService, S3ImageStorageService],
  exports: [S3ImageStorageService],
})
export class AppModule {}