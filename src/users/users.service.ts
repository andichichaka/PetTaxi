import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(email: string, username: string, pass: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(pass, 10);
    const user = this.usersRepository.create({email, username, password: hashedPassword });

    await this.usersRepository.save(user);
    return user;
  }

  async findUser(username: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: {username} })
  }

}
