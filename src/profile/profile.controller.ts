import { Controller, Get, UseGuards, Req, Body, Put, UseInterceptors, UploadedFile, Post, Patch } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get()
  async getProfile(@Req() req) {
    return this.profileService.getProfile(req.user.sub);
  }

  @Put('update')
  async updateProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
     return this.profileService.updateProfile(req.user.sub, updateProfileDto);
  }

  @Post('upload-profile-pic')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePic(@Req() req, @UploadedFile() file: Express.Multer.File) {
    const userId = req.user.sub;
    console.log('User ID:', userId);
    return this.profileService.uploadProfilePic(userId, file);
  }

  @Put('update-profile-pic')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(@Req() req, @UploadedFile() file: Express.Multer.File) {
    const userId = req.user.sub;
    console.log('User ID:', userId);
    return this.profileService.updateProfilePicture(userId, file);
  }

  @Patch('set-role')
  async setRole(@Req() req, @Body('role') role: string) {
    return this.profileService.setRole(req.user.sub, role);
  }
}
