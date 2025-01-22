import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Post } from '../posts/post.entity';
import { User } from '../users/user.entity';
import { Service } from 'src/posts/service.entity';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Role } from 'src/roles/enum/role.enum';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
    private emailService: EmailService,
  ) {}

  async createBooking(createBookingDto: CreateBookingDto, user: User): Promise<Booking> {
    const { serviceId, animalType, animalSize, bookingDates, notes } = createBookingDto;
  
    const service = await this.servicesRepository.findOne({ where: { id: serviceId }, relations: ['post'] });
    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }
  
    if (service.serviceType === 'other' && bookingDates) {
      throw new BadRequestException(`'other' service type does not allow booking dates`);
    }
  
    if (bookingDates && bookingDates.some((date) => service.unavailableDates.includes(date))) {
      throw new BadRequestException(`One or more booking dates are unavailable`);
    }
  
    const booking = this.bookingRepository.create({
      service,
      user,
      animalType,
      animalSize,
      bookingDates: bookingDates || [],
      price: service.price,
      notes,
      isApproved: service.serviceType === 'other' ? false : true, // Automatically approve non-'other' bookings
    });
  
    const savedBooking = await this.bookingRepository.save(booking);
  
    if (!savedBooking.isApproved) {
      await this.notifyPostOwner(savedBooking);
    }
  
    return savedBooking;
  }
  
  

  async getBookingsByUser(userId: number): Promise<Booking[]> {
    return this.bookingRepository.find({ where: { user: { id: userId } }, relations: ['post'] });
  }

  async getAllBookings(serviceId?: number, userId?: number): Promise<Booking[]> {
    const queryBuilder = this.bookingRepository.createQueryBuilder('booking')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('booking.user', 'user');
  
    if (serviceId) {
      queryBuilder.andWhere('service.id = :serviceId', { serviceId });
    }
  
    if (userId) {
      queryBuilder.andWhere('user.id = :userId', { userId });
    }
  
    return queryBuilder.getMany();
  }
  
  async updateBooking(
    id: number,
    updateBookingDto: UpdateBookingDto,
  ): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({ where: { id }, relations: ['service'] });
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }
  
    const service = booking.service;
  
    if (updateBookingDto.animalType) {
      booking.animalType = updateBookingDto.animalType;
    }
  
    if (updateBookingDto.animalSize) {
      booking.animalSize = updateBookingDto.animalSize;
    }
  
    if (updateBookingDto.bookingDates) {
      if (service.serviceType === 'other') {
        throw new Error(`'other' service type does not allow booking dates`);
      }
  
      const invalidDates = updateBookingDto.bookingDates.filter((date) =>
        service.unavailableDates.includes(date),
      );
      if (invalidDates.length > 0) {
        throw new Error(`The following dates are unavailable: ${invalidDates.join(', ')}`);
      }
  
      booking.bookingDates = updateBookingDto.bookingDates;
    }
  
    if (updateBookingDto.notes) {
      booking.notes = updateBookingDto.notes;
    }
  
    return this.bookingRepository.save(booking);
  }
  
  
  async deleteBooking(id: number, user: User): Promise<void> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }
  
    if (booking.user.id !== user.id && user.role !== Role.Admin) {
      throw new Error(`You do not have permission to delete this booking`);
    }
  
    await this.bookingRepository.delete(id);
  }
  
  async notifyPostOwner(booking: Booking): Promise<void> {
    const postOwner = booking.service.post.user;
  
    const approvalLink = `${process.env.APP_URL}/bookings/approve/${booking.id}`;
    await this.emailService.sendMail({
      to: postOwner.email,
      subject: 'Booking Approval Needed',
      text: `
        A booking request has been made for your post.
        
        Booking Details:
        - User: ${booking.user.username}
        - Email: ${booking.user.email}
        - Dates: ${booking.bookingDates.join(', ') || 'Custom schedule (contact the user)'}
        - Animal: ${booking.animalType} (${booking.animalSize})
        
        Please approve the booking using the following link:
        ${approvalLink}
      `,
    });
  }

  async approveBooking(id: number): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({ where: { id }, relations: ['service'] });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
  
    booking.isApproved = true;
    return this.bookingRepository.save(booking);
  }
  
}
