import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { S3ImageStorageService } from 'src/image-storage/services/s3-image-storage.service';
import { Role } from 'src/roles/enum/role.enum';
import { access } from 'fs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private s3ImageStorageService: S3ImageStorageService,
    private jwtService: JwtService,
  ) {}

  async getProfile(userId: number): Promise<any> {
    const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['posts', 'posts.services', 'posts.services.bookings'], // Include related entities
    });

    if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return {
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
                email: post.user.email,
                username: post.user.username,
                profilePicture: post.user.profilePic,
            },
            services: post.services.map((service) => ({
                id: service.id || null,
                // bookings: service.bookings?.map((booking) => ({
                //     id: booking?.id || null,
                //     serviceId: booking?.service?.id || null,
                //     userId: booking?.user?.id || null,
                //     bookingDates: booking?.bookingDates || null,
                //     notes: booking?.notes || null,
                // })) || [],
                serviceType: service.serviceType,
                price: parseFloat(service.price.toString()),
                unavailableDates: service.unavailableDates,
            })),
        })),
    };
}

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto): Promise<any> {
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

  async setRole(id: number, role: string): Promise<any> {
    const validRole = this.validateRole(role);
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.role = validRole;
    const newUser = await this.userRepository.save(user);

    const payload = { username: newUser.username, sub: newUser.id, roles: newUser.role };
    const token = await this.jwtService.signAsync(payload, { secret: process.env.JWT_SECRET });

    return {
        id: newUser.id,
        access_token: token,
        username: newUser.email,
        email: newUser.username,
        role: newUser.role,
    };
}

private validateRole(role: string): Role {
  if (!Object.values(Role).includes(role as Role)) {
      throw new NotFoundException(`Invalid role: ${role}`);
  }
  return role as Role;
}

}
