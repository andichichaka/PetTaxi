import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getProfile(userId: number): Promise<User> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto): Promise<User> {
    await this.userRepository.update(userId, updateProfileDto);
    return this.userRepository.findOneBy({ id: userId });
  }
}
