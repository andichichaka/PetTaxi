import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from '../src/booking/booking.service';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Booking } from '../src/booking/booking.entity';
import { Service } from '../src/posts/entities/service.entity';
import { EmailService } from '../src/utilities/email.service';
import { CreateBookingDto } from '../src/booking/dto/create-booking.dto';
import { UpdateBookingDto } from '../src/booking/dto/update-booking.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { User } from '../src/users/user.entity';
import { ServiceType } from '../src/posts/enum/service-type.enum';
import { AnimalType } from '../src/posts/enum/animal-type.enum';
import { AnimalSize } from '../src/posts/enum/animal-size.enum';

describe('BookingService', () => {
  let service: BookingService;
  let bookingRepo: jest.Mocked<Repository<Booking>>;
  let serviceRepo: jest.Mocked<Repository<Service>>;
  let emailService: jest.Mocked<EmailService>;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<Booking>>;

  const mockUser: User = {
    id: 1,
    email: 'user@example.com',
    username: 'testuser',
    password: 'pass',
    role: undefined,
    isEmailVerified: true,
    posts: [],
    bookings: [],
    codes: [],
    reviews: [],
  };

  const mockService: Service = {
    id: 1,
    serviceType: ServiceType.DailyWalking,
    price: 100,
    unavailableDates: [],
    bookings: [],
    post: {
      id: 2,
      user: mockUser,
      description: '',
      imagesUrl: [],
      location: null,
      services: [],
      reviews: [],
      animalType: AnimalType.Dog,
      animalSizes: [],
    } as any,
  };

  beforeEach(async () => {
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<SelectQueryBuilder<Booking>>;

    bookingRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as unknown as jest.Mocked<Repository<Booking>>;

    serviceRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<Service>>;

    emailService = {
      sendMail: jest.fn(),
    } as unknown as jest.Mocked<EmailService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        { provide: getRepositoryToken(Booking), useValue: bookingRepo },
        { provide: getRepositoryToken(Service), useValue: serviceRepo },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
  });

  describe('createBooking', () => {
    const dto: CreateBookingDto = {
      serviceId: 1,
      animalType: AnimalType.Dog,
      animalSize: AnimalSize.Small,
      bookingDates: ['2025-06-01'],
      notes: 'fragile dog',
    };

    it('should throw if service not found', async () => {
      serviceRepo.findOne.mockResolvedValue(null);
      await expect(service.createBooking(dto, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw if type is "other" and has dates', async () => {
      serviceRepo.findOne.mockResolvedValue({ ...mockService, serviceType: ServiceType.Other });
      await expect(service.createBooking(dto, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should throw if date is unavailable', async () => {
      serviceRepo.findOne.mockResolvedValue({ ...mockService, unavailableDates: ['2025-06-01'] });
      await expect(service.createBooking(dto, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should create booking and send email', async () => {
      serviceRepo.findOne.mockResolvedValue(mockService);
      const booking = {
        id: 1,
        user: mockUser,
        service: mockService,
        animalType: AnimalType.Dog,
        animalSize: AnimalSize.Small,
        bookingDates: ['2025-06-01'],
        price: 100,
        notes: 'fragile dog',
        isApproved: false,
        createdAt: new Date(),
      };
      bookingRepo.create.mockReturnValue(booking as Booking);
      bookingRepo.save.mockResolvedValue(booking as Booking);

      const result = await service.createBooking(dto, mockUser);
      expect(result).toEqual(booking);
      expect(emailService.sendMail).toHaveBeenCalled();
    });
  });

  describe('updateBooking', () => {
    const dto: UpdateBookingDto = {
      animalType: AnimalType.Cat,
      animalSize: AnimalSize.Medium,
      notes: 'updated',
      bookingDates: ['2025-07-01'],
    };

    it('should throw if booking not found', async () => {
      bookingRepo.findOne.mockResolvedValue(null);
      await expect(service.updateBooking(1, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw if type is other and bookingDates given', async () => {
      bookingRepo.findOne.mockResolvedValue({
        id: 1,
        user: mockUser,
        service: { ...mockService, serviceType: ServiceType.Other },
        animalType: AnimalType.Dog,
        animalSize: AnimalSize.Medium,
        bookingDates: [],
        price: 100,
        notes: '',
        isApproved: false,
        createdAt: new Date(),
      });
      await expect(service.updateBooking(1, dto)).rejects.toThrow();
    });

    it('should throw if any bookingDates are unavailable', async () => {
      bookingRepo.findOne.mockResolvedValue({
        id: 1,
        user: mockUser,
        service: { ...mockService, unavailableDates: ['2025-07-01'] },
        animalType: AnimalType.Dog,
        animalSize: AnimalSize.Medium,
        bookingDates: [],
        price: 100,
        notes: '',
        isApproved: false,
        createdAt: new Date(),
      });
      await expect(service.updateBooking(1, dto)).rejects.toThrow();
    });

    it('should update and save booking', async () => {
      const existing = {
        id: 1,
        user: mockUser,
        service: mockService,
        animalType: AnimalType.Dog,
        animalSize: AnimalSize.Medium,
        bookingDates: [],
        price: 100,
        notes: '',
        isApproved: false,
        createdAt: new Date(),
      };
      bookingRepo.findOne.mockResolvedValue(existing);
      bookingRepo.save.mockResolvedValue({ ...existing, ...dto });

      const result = await service.updateBooking(1, dto);
      expect(result.notes).toBe('updated');
    });
  });

  describe('deleteBooking', () => {
    it('should throw if not found', async () => {
      bookingRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteBooking(123)).rejects.toThrow(NotFoundException);
    });

    it('should delete successfully', async () => {
      bookingRepo.findOne.mockResolvedValue({
        id: 1,
        user: mockUser,
        service: mockService,
        animalType: AnimalType.Dog,
        animalSize: AnimalSize.Small,
        bookingDates: [],
        price: 100,
        notes: '',
        isApproved: false,
        createdAt: new Date(),
      });
      await service.deleteBooking(1);
      expect(bookingRepo.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('approveBooking', () => {
    it('should throw if not found', async () => {
      bookingRepo.findOne.mockResolvedValue(null);
      await expect(service.approveBooking(1)).rejects.toThrow(NotFoundException);
    });

    it('should update approval and unavailableDates', async () => {
      const booking = {
        id: 1,
        user: mockUser,
        service: {
          ...mockService,
          unavailableDates: ['2025-07-01'],
        },
        animalType: AnimalType.Dog,
        animalSize: AnimalSize.Medium,
        bookingDates: ['2025-08-01'],
        price: 100,
        notes: '',
        isApproved: false,
        createdAt: new Date(),
      };
      bookingRepo.findOne.mockResolvedValue(booking as Booking);
      bookingRepo.save.mockResolvedValue({ ...booking, isApproved: true });

      const result = await service.approveBooking(1);
      expect(result.isApproved).toBe(true);
      expect(serviceRepo.save).toHaveBeenCalled();
    });
  });

  describe('getPendingBookings', () => {
    it('should get pending bookings', async () => {
      const result = await service.getPendingBookings(1);
      expect(result).toEqual([]);
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });
  });

  describe('getApprovedBookings', () => {
    it('should get approved bookings', async () => {
      const result = await service.getApprovedBookings(1);
      expect(result).toEqual([]);
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });
  });
});