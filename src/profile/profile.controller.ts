import { Controller, Get, UseGuards, Req, Body, Put } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getProfile(@Req() req) {
    return this.profileService.getProfile(req.sub);
  }

  @UseGuards(JwtAuthGuard)
    @Put()
    async updateProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
        return this.profileService.updateProfile(req.user.userId, updateProfileDto);
    }
}
