import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingListResponseDto } from './dto/response/booking-list-response.dto';
import { Service } from 'src/posts/service.entity';
import { User } from 'src/users/user.entity';
import { EmailService } from 'src/email/email.service';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
    private emailService: EmailService,
  ) {}

  async createBooking(
    createBookingDto: CreateBookingDto,
    user: User,
  ): Promise<Booking> {
    const { serviceId, animalType, animalSize, bookingDates, notes } =
      createBookingDto;

    const service = await this.servicesRepository.findOne({
      where: { id: serviceId },
      relations: ['post'],
    });
    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    if (service.serviceType === 'other' && bookingDates) {
      throw new BadRequestException(
        `'other' service type does not allow booking dates`,
      );
    }

    if (
      bookingDates &&
      bookingDates.some((date) => service.unavailableDates.includes(date))
    ) {
      throw new BadRequestException(
        `One or more booking dates are unavailable`,
      );
    }

    const booking = this.bookingRepository.create({
      service,
      user,
      animalType,
      animalSize,
      bookingDates: bookingDates || [],
      price: service.price,
      notes,
      isApproved: false,
    });

    const savedBooking = await this.bookingRepository.save(booking);

    if (!savedBooking.isApproved) {
      await this.notifyPostOwner(savedBooking);
    }

    return savedBooking;
  }

  async getBookingsByUser(userId: number): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { user: { id: userId } },
      relations: ['post'],
    });
  }

  async getAllBookings(
    serviceId?: number,
    userId?: number,
  ): Promise<Booking[]> {
    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
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
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['service'],
    });
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
        throw new Error(
          `The following dates are unavailable: ${invalidDates.join(', ')}`,
        );
      }

      booking.bookingDates = updateBookingDto.bookingDates;
    }

    if (updateBookingDto.notes) {
      booking.notes = updateBookingDto.notes;
    }

    return this.bookingRepository.save(booking);
  }

  async deleteBooking(id: number): Promise<void> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    await this.bookingRepository.delete(id);
  }

  async notifyPostOwner(booking: Booking): Promise<void> {
    const postOwner = booking.service.post.user;

    const approvalLink = `${process.env.APP_URL}/bookings/approve/${booking.id}`;
    await this.emailService.sendMail({
      to: postOwner.email,
      subject: 'Booking Approval Needed',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #007bff; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Booking Approval Needed</h1>
            <p style="margin: 5px 0;">A booking request has been made for your post</p>
          </div>
          <div style="padding: 20px;">
            <p style="font-size: 16px;">Here are the details of the booking request:</p>
            <ul style="list-style: none; padding: 0;">
              <li><strong>User:</strong> ${booking.user.username}</li>
              <li><strong>Email:</strong> ${booking.user.email}</li>
              <li><strong>Dates:</strong> ${booking.bookingDates.join(', ') || 'Custom schedule (contact the user)'}</li>
              <li><strong>Animal:</strong> ${booking.animalType} (${booking.animalSize})</li>
            </ul>
            <p style="font-size: 16px;">To approve this booking, click the button below:</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${approvalLink}" style="background-color: #007bff; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block; font-size: 16px;">Approve Booking</a>
            </div>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #6c757d; text-align: center;">PetTaxi Team</p>
          </div>
        </div>
      `,
    });
  }

  async approveBooking(id: number): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['service'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const service = booking.service;

    if (!service) {
      throw new NotFoundException('Service associated with the booking not found');
    }

    booking.isApproved = true;
    const updatedUnavailableDates = [
      ...new Set([...service.unavailableDates, ...booking.bookingDates]),
    ];
    service.unavailableDates = updatedUnavailableDates;

    await this.servicesRepository.save(service);
    return this.bookingRepository.save(booking);
  }

  async getPendingBookings(id: number): Promise<BookingListResponseDto[]> {
    const bookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('service.post', 'post')
      .leftJoinAndSelect('post.user', 'postOwner')
      .leftJoinAndSelect('booking.user', 'user')
      .where('postOwner.id = :id', { id })
      .andWhere('booking.isApproved = false')
      .orderBy('booking.createdAt', 'DESC')
      .getMany();

    return plainToInstance(
      BookingListResponseDto,
      bookings.map((booking) => ({
        ...booking,
        service: booking.service && {
          ...booking.service,
          post: booking.service.post
            ? {
                id: booking.service.post.id,
                imagesUrl: booking.service.post.imagesUrl ?? [],
                description: booking.service.post.description ?? '',
                animalType: booking.service.post.animalType ?? '',
                animalSizes: booking.service.post.animalSizes ?? [],
                user: booking.service.post.user ?? null,
                services: booking.service.post.services ?? [],
                reviews: booking.service.post.reviews ?? [],
              }
            : null,
        },
        createdAt: booking.createdAt.toISOString(),
      })),
    );
  }

  async getApprovedBookings(userId: number): Promise<BookingListResponseDto[]> {
    const bookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('service.post', 'post')
      .leftJoinAndSelect('post.user', 'postOwner')
      .leftJoinAndSelect('booking.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('booking.isApproved = true')
      .orderBy('booking.createdAt', 'DESC')
      .getMany();

    return plainToInstance(
      BookingListResponseDto,
      bookings.map((booking) => ({
        ...booking,
        service: booking.service && {
          ...booking.service,
          post: booking.service.post
            ? {
                id: booking.service.post.id,
                imagesUrl: booking.service.post.imagesUrl ?? [],
                description: booking.service.post.description ?? '',
                animalType: booking.service.post.animalType ?? '',
                animalSizes: booking.service.post.animalSizes ?? [],
                user: booking.service.post.user ?? null,
                services: booking.service.post.services ?? [],
                reviews: booking.service.post.reviews ?? [],
              }
            : null,
        },
        createdAt: booking.createdAt.toISOString(),
      })),
    );
  }
}