import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/roles/enum/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async createUser(email: string, username: string, password: string, role: string): Promise<User | null> {
    const existingUser = await this.usersRepository.findOne({ 
        where: [{ email }, { username }]
    });
    if (existingUser) {
        return null;
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    let role_from_enum: Role;
    if(role === 'admin') {
        role_from_enum = Role.Admin;
    }
    else {
        role_from_enum = Role.User;
    }
    const newUser = this.usersRepository.create({ email, username, password: hashedPassword, role: role_from_enum });
    this.usersRepository.save(newUser);
    return newUser;
  }       

  async findUser(username: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: {username} })
  }

  async findUserById(id: number): Promise<User | undefined> {
    return this.usersRepository.findOne({where: {id} });
  }

}
