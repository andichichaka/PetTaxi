import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './booking.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { Post } from '../posts/entities/post.entity';
import { Service } from '../posts/entities/service.entity';
import { EmailService } from '../utilities/email.service';
import { Location } from '../posts/entities/location.entity';

@Module({
  imports: [AuthModule, UsersModule, TypeOrmModule.forFeature([Post, Service, Booking, Location])],
  providers: [BookingService, EmailService],
  controllers: [BookingController],
  exports: [TypeOrmModule.forFeature([Booking])]
})
export class BookingModule {}
