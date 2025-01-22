import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LessThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Code } from './code.entity';

@Injectable()
export class CodesCleanupService {
  constructor(
    @InjectRepository(Code)
    private readonly codesRepository: Repository<Code>,
  ) {}

  @Cron('0 0 * * *') // Runs daily at 00:00
  async handleCleanup() {
    console.log(`[${new Date().toISOString()}] Cleaning up expired codes...`);

    const result = await this.codesRepository.delete({
      expireAt: LessThan(new Date()),
    });

    console.log(`Deleted ${result.affected} expired codes.`);
  }
}
