import { Test, TestingModule } from '@nestjs/testing';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { UsersService } from '../users/users.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { AnimalType } from '../posts/enum/animal-type.enum';
import { AnimalSize } from '../posts/enum/animal-size.enum';

describe('BookingController', () => {
  let controller: BookingController;
  let bookingService: jest.Mocked<Partial<BookingService>>;
  let usersService: jest.Mocked<Partial<UsersService>>;

  const mockUser = { id: 1, username: 'test', email: 'test@test.com' };

  beforeEach(async () => {
    bookingService = {
      createBooking: jest.fn(),
      getBookingsByUser: jest.fn(),
      getAllBookings: jest.fn(),
      updateBooking: jest.fn(),
      getPendingBookings: jest.fn(),
      getApprovedBookings: jest.fn(),
      approveBooking: jest.fn(),
      deleteBooking: jest.fn(),
    };

    usersService = {
      findUserById: jest.fn().mockResolvedValue(mockUser),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        { provide: BookingService, useValue: bookingService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    controller = module.get<BookingController>(BookingController);
  });

  describe('createBooking()', () => {
    it('should transform enums and call service', async () => {
      const dto: CreateBookingDto = {
        serviceId: 5,
        animalType: AnimalType.Dog,
        animalSize: AnimalSize.Medium,
        bookingDates: ['2024-05-22'],
        notes: 'Handle with care',
      };

      await controller.createBooking(dto, { user: { sub: 1 } });

      expect(usersService.findUserById).toHaveBeenCalledWith(1);
      expect(bookingService.createBooking).toHaveBeenCalledWith(
        {
          ...dto,
          serviceId: 5,
          animalType: AnimalType.Dog,
          animalSize: AnimalSize.Medium,
        },
        mockUser,
      );
    });
  });

  describe('getUserBookings()', () => {
    it('should fetch user bookings', async () => {
      await controller.getUserBookings({ user: { id: 1 } });
      expect(bookingService.getBookingsByUser).toHaveBeenCalledWith(1);
    });
  });

  describe('getAllBookings()', () => {
    it('should call service with query filters', async () => {
      await controller.getAllBookings(2, 3);
      expect(bookingService.getAllBookings).toHaveBeenCalledWith(2, 3);
    });
  });

  describe('updateBooking()', () => {
    it('should convert enums and call update', async () => {
      const dto: UpdateBookingDto = {
        animalType: AnimalType.Cat,
        animalSize: AnimalSize.Small,
        notes: 'No allergies',
      };
      await controller.updateBooking(1, dto);
      expect(bookingService.updateBooking).toHaveBeenCalledWith(1, {
        animalType: AnimalType.Cat,
        animalSize: AnimalSize.Small,
        notes: 'No allergies',
      });
    });
  });

  describe('getPendingBookings()', () => {
    it('should call pending bookings service', async () => {
      await controller.getPendingBookings({ user: { sub: 1 } });
      expect(bookingService.getPendingBookings).toHaveBeenCalledWith(1);
    });
  });

  describe('getApprovedBookings()', () => {
    it('should call approved bookings service', async () => {
      await controller.getApprovedBookings({ user: { sub: 1 } });
      expect(bookingService.getApprovedBookings).toHaveBeenCalledWith(1);
    });
  });

  describe('approveBooking()', () => {
    it('should call approveBooking with ID', async () => {
      await controller.approveBooking(9);
      expect(bookingService.approveBooking).toHaveBeenCalledWith(9);
    });
  });

  describe('disapproveBooking()', () => {
    it('should delete booking and return message', async () => {
      const result = await controller.disapproveBooking(9);
      expect(bookingService.deleteBooking).toHaveBeenCalledWith(9);
      expect(result).toEqual({ message: 'Booking disapproved and deleted' });
    });
  });
});