import {
    Controller,
    Post,
    Body,
    Req,
    Get,
    Delete,
    Param,
    Put,
    Query,
  } from '@nestjs/common';
  import { BookingService } from './booking.service';
  import { CreateBookingDto } from './dto/create-booking.dto';
  import { Roles } from '../roles/decorator/roles.decorator';
  import { Role } from '../roles/enum/role.enum';
  import { UpdateBookingDto } from './dto/update-booking.dto';
  import { ServiceType } from '../posts/enum/service-type.enum';
  import { AnimalType } from '../posts/enum/animal-type.enum';
  import { AnimalSize } from '../posts/enum/animal-size.enum';
import { UsersService } from 'src/users/users.service';
  
  @Controller('bookings')
  export class BookingController {
    constructor(private bookingService: BookingService,
        private usersService: UsersService
    ) {}
  
    @Post()
    @Roles(Role.User)
    async createBooking(@Body() createBookingDto: CreateBookingDto, @Req() req) {
      if (createBookingDto.serviceId) {
        createBookingDto.serviceId = +createBookingDto.serviceId;
      }
  
      if (createBookingDto.animalType) {
        createBookingDto.animalType = createBookingDto.animalType as AnimalType;
      }
  
      if (createBookingDto.animalSize) {
        createBookingDto.animalSize = createBookingDto.animalSize as AnimalSize;
      }
  
      const user = await this.usersService.findUserById(req.user.sub);
      return this.bookingService.createBooking(createBookingDto, user);
    }
  
    @Get('user')
    async getUserBookings(@Req() req) {
      const userId = req.user.id;
      return this.bookingService.getBookingsByUser(userId);
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
      @Body() updateBookingDto: UpdateBookingDto,
    ) {
      if (updateBookingDto.animalType) {
        updateBookingDto.animalType = updateBookingDto.animalType as AnimalType;
      }
  
      if (updateBookingDto.animalSize) {
        updateBookingDto.animalSize = updateBookingDto.animalSize as AnimalSize;
      }
  
      return this.bookingService.updateBooking(id, updateBookingDto);
    }
  
    @Delete(':id')
    @Roles(Role.User)
    async deleteBooking(@Param('id') id: number, @Req() req) {
      const user = await this.usersService.findUserById(req.user.sub);
      return this.bookingService.deleteBooking(id, user);
    }

    @Put('approve/:id')
    @Roles(Role.Admin, Role.User)
    async approveBooking(@Param('id') id: number) {
        return this.bookingService.approveBooking(id);
    }

  }
  