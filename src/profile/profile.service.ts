import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { S3ImageStorageService } from 'src/image-storage/s3-image-storage.service';
import { Role } from 'src/roles/enum/role.enum';
import { access } from 'fs';
import { JwtService } from '@nestjs/jwt';
import { GetProfileResponseDto } from './dto/response/get-profile-response.dto';
import { plainToInstance } from 'class-transformer';
import { UpdateProfileResponseDto } from './dto/response/update-profile.response.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private s3ImageStorageService: S3ImageStorageService,
    private jwtService: JwtService,
  ) {}

  async getProfile(userId: number): Promise<GetProfileResponseDto> {
    const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['posts', 'posts.services', 'posts.services.bookings'],
    });

    if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return plainToInstance(GetProfileResponseDto, {
        id: user.id,
        username: user.username,
        email: user.email,
        description: user.description,
        profilePicture: user.profilePic,
        posts: user.posts.map((post) => ({
            id: post.id,
            imagesUrl: post.imagesUrl || null,
            description: post.description,
            animalType: post.animalType,
            animalSizes: post.animalSizes,
            user: {
                id: post.user.id,
                email: post.user.email,
                username: post.user.username,
                profilePicture: post.user.profilePic,
            },
            location: post.location,
            services: post.services.map((service) => ({
                id: service.id || null,
                serviceType: service.serviceType,
                price: parseFloat(service.price.toString()),
                unavailableDates: service.unavailableDates,
            })),
        })),
    });
}

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto): Promise<UpdateProfileResponseDto> {
    await this.userRepository.update(userId, updateProfileDto);
    const user = this.userRepository.findOneBy({ id: userId });
    return{
      email : (await user).email,
      username: (await user).username,
      description: (await user).description
    }
  }

  async uploadProfilePic(userId: number, file: Express.Multer.File): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const key = `profile-pictures/user-${userId}-${Date.now()}`;

    const fileUrl = await this.s3ImageStorageService.uploadFile(file, key);

    user.profilePic = fileUrl;
    await this.userRepository.save(user);

    return fileUrl;
  }

  async updateProfilePicture(userId: number, file: Express.Multer.File): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const oldKey = user.profilePic ? this.extractS3Key(user.profilePic) : null;
    const newKey = `profile-pictures/${userId}-${Date.now()}`;

    const newUrl = await this.s3ImageStorageService.replaceFile(oldKey, file, newKey);
    user.profilePic = newUrl;

    return this.userRepository.save(user);
  }

  private extractS3Key(url: string): string {
    const bucketName = process.env.S3_BUCKET_NAME;
    const region = process.env.AWS_REGION;
    return url.replace(`https://${bucketName}.s3.${region}.amazonaws.com/`, '');
  }

}
