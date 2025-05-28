import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import { ProfileController } from '../src/profile/profile.controller';
import { ProfileService } from '../src/profile/profile.service';
import { ProfileModule } from '../src/profile/profile.module';
import { AuthController } from '../src/auth/auth.controller';
import { PostsModule } from '../src/posts/posts.module';
import { ImageStorageModule } from '../src/image-storage/image-storage.module';
import { S3ImageStorageService } from '../src/image-storage/s3-image-storage.service';
import { JwtService } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { RolesGuard } from '../src/roles/roles.guard';
import { PostsController } from '../src/posts/posts.controller';
import { PostsService } from '../src/posts/posts.service';
import { BookingModule } from '../src/booking/booking.module';
import { BookingController } from '../src/booking/booking.controller';
import { BookingService } from '../src/booking/booking.service';
import { EmailService } from '../src/utilities/email.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ReviewsModule } from '../src/reviews/reviews.module';
import { ReviewController } from '../src/reviews/reviews.controller';
import { ReviewService } from '../src/reviews/reviews.service';
import connectDB from '../src/config/data-source.config';

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
  controllers: [ProfileController, AuthController, PostsController, BookingController, ReviewController],
  providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard, /*Global AuthGuard*/ },
  { provide: APP_GUARD, useClass: RolesGuard, /*Global RolesGuard*/ },
  JwtService, ProfileService, S3ImageStorageService, PostsService, BookingService, EmailService, ReviewService],
  exports: [S3ImageStorageService],
})
export class AppModule {}