import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/roles/enum/role.enum';
import { S3ImageStorageService } from 'src/image-storage/services/s3-image-storage.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private s3ImageStorageService: S3ImageStorageService,
  ) {}

  async createUser(email: string, username: string, password: string, role: string): Promise<User | null> {
    const existingUser = await this.usersRepository.findOne({ 
        where: [{ email }, { username }]
    });
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return null;
    }
  }

    const hashedPassword = await bcrypt.hash(password, 12);
    const role_from_enum: Role = role === 'admin' ? Role.Admin : Role.User;

    const newUser = this.usersRepository.create({ email, username, password: hashedPassword, role: role_from_enum });

    const savedUser = await this.usersRepository.save(newUser);
    
    return savedUser;
}


  async findUser(username: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: {username}, select: ["id", "username", "email", "password", "role", "isEmailVerified"] });
  }

  async findUserById(id: number): Promise<User | undefined> {
    return this.usersRepository.findOne({where: {id} });
  }
}
