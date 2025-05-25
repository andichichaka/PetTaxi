import { 
  Controller,
  Get,
  Req, 
  Body, 
  Put, 
  UseInterceptors, 
  UploadedFile, 
  Post,
  Param } from '@nestjs/common';
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

  @Get(':id')
  async getUserProfileById(@Param('id') id: number) {
    return this.profileService.getProfile(id);
  }

  @Put('update')
  async updateProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
     return this.profileService.updateProfile(req.user.sub, updateProfileDto);
  }

  @Post('upload-profile-pic')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePic(@Req() req, @UploadedFile() file: Express.Multer.File) {
    const userId = req.user.sub;
    return this.profileService.uploadProfilePic(userId, file);
  }

  @Put('update-profile-pic')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(@Req() req, @UploadedFile() file: Express.Multer.File) {
    const userId = req.user.sub;
    return this.profileService.updateProfilePicture(userId, file);
  }
}
