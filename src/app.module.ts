import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { User } from './users/user.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProfileController } from './profile/profile.controller';
import { ProfileService } from './profile/profile.service';
import { ProfileModule } from './profile/profile.module';
import { AuthController } from './auth/auth.controller';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 1000),
        username: process.env.PS_USER,
        password: String(process.env.PS_PASS),
        database: process.env.PS_DB,
        entities: [User],
        synchronize: true,
      })
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ProfileModule,
  ],
  controllers: [AppController, ProfileController, AuthController],
  providers: [AppService, ProfileService],
})
export class AppModule {}