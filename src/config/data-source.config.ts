import * as dotenv from 'dotenv';
import { Booking } from 'src/booking/booking.entity';
import { Post } from 'src/posts/post.entity';
import { Service } from 'src/posts/service.entity';
import { Review } from 'src/reviews/entities/review.entity';
import { Code } from 'src/users/code.entity';
import { User } from 'src/users/user.entity';
import { DataSource } from 'typeorm';

dotenv.config();

const connectDB = new DataSource({
  type: 'postgres',
  synchronize: false,
  migrationsTableName: 'migrations',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  database: process.env.PS_DB,
  username: process.env.PS_USER,
  password: process.env.PS_PASS,
  migrations: [__dirname + '/../migrations/*.ts'],
  entities: [User, Post, Service, Booking, Code, Review],
});

export const initializeDB = async () => {
  try {
    await connectDB.initialize();
    console.log('Database connection initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
};

export default connectDB;