import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Roles } from '../roles/decorator/roles.decorator';
import { Role } from '../roles/enum/role.enum';
import { AnimalType } from '../posts/enum/animal-type.enum';
import { AnimalSize } from '../posts/enum/animal-size.enum';
import { UsersService } from '../users/users.service';

@Controller('bookings')
export class BookingController {
  constructor(
    private bookingService: BookingService,
    private usersService: UsersService,
  ) {}

  @Post('create')
  @Roles(Role.User)
  async createBooking(@Body() dto: CreateBookingDto, @Req() req) {
    if (dto.serviceId) dto.serviceId = +dto.serviceId;
    if (dto.animalType) dto.animalType = dto.animalType as AnimalType;
    if (dto.animalSize) dto.animalSize = dto.animalSize as AnimalSize;

    const user = await this.usersService.findUserById(req.user.sub);
    return this.bookingService.createBooking(dto, user);
  }

  @Get('user')
  async getUserBookings(@Req() req) {
    return this.bookingService.getBookingsByUser(req.user.id);
  }

  @Get()
  @Roles(Role.Admin)
  async getAllBookings(
    @Query('serviceId') serviceId?: number,
    @Query('userId') userId?: number,
  ) {
    return this.bookingService.getAllBookings(serviceId, userId);
  }

  @Put(':id')
  @Roles(Role.Admin)
  async updateBooking(
    @Param('id') id: number,
    @Body() dto: UpdateBookingDto,
  ) {
    if (dto.animalType) dto.animalType = dto.animalType as AnimalType;
    if (dto.animalSize) dto.animalSize = dto.animalSize as AnimalSize;

    return this.bookingService.updateBooking(id, dto);
  }

  @Get('pending')
  @Roles(Role.Admin)
  async getPendingBookings(@Req() req) {
    return this.bookingService.getPendingBookings(req.user.sub);
  }

  @Get('approved')
  @Roles(Role.User)
  async getApprovedBookings(@Req() req) {
    return this.bookingService.getApprovedBookings(req.user.sub);
  }

  @Put('approve/:id')
  @Roles(Role.Admin, Role.User)
  async approveBooking(@Param('id') id: number) {
    return this.bookingService.approveBooking(id);
  }

  @Patch('disapprove/:id')
  async disapproveBooking(@Param('id') id: number) {
    await this.bookingService.deleteBooking(id);
    return { message: 'Booking disapproved and deleted' };
  }
}