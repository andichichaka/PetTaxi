import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
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
import { PostsController } from './posts/posts.controller';
import { PostsService } from './posts/posts.service';
import { BookingModule } from './booking/booking.module';
import { BookingController } from './booking/booking.controller';
import { BookingService } from './booking/booking.service';
import { EmailService } from './email/email.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ReviewsModule } from './reviews/reviews.module';
import { ReviewController } from './reviews/reviews.controller';
import { ReviewService } from './reviews/reviews.service';
import connectDB from './config/data-source.config';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    TypeOrmModule.forRoot(connectDB.options),
    ProfileModule,
    PostsModule,
    ImageStorageModule,
    BookingModule,
    ReviewsModule,
  ],
  controllers: [AppController, ProfileController, AuthController, PostsController, BookingController, ReviewController],
  providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard, /*Global AuthGuard*/ },
  { provide: APP_GUARD, useClass: RolesGuard, /*Global RolesGuard*/ },
  JwtService, AppService, ProfileService, S3ImageStorageService, PostsService, BookingService, EmailService, ReviewService],
  exports: [S3ImageStorageService],
})
export class AppModule {}