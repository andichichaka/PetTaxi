import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './booking.entity';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { Post } from 'src/posts/post.entity';
import { Service } from 'src/posts/service.entity';
import { EmailService } from 'src/email/email.service';

@Module({
  imports: [AuthModule, UsersModule, TypeOrmModule.forFeature([Post, Service, Booking])],
  providers: [BookingService, EmailService],
  controllers: [BookingController],
  exports: [TypeOrmModule.forFeature([Booking])]
})
export class BookingModule {}
