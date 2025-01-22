import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Request
  } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { SignUpDTO } from './dto/sign-up.dto';
import { Public } from './public.decorator';
import { Role } from 'src/roles/enum/role.enum';
import { Roles } from 'src/roles/decorator/roles.decorator';
  
  @Controller('auth')
  export class AuthController {
    constructor(private authService: AuthService) {}
  
    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('login')
    signIn(@Body() signInDto: LoginDTO) {
      return this.authService.signIn(signInDto.username, signInDto.password);
    }

    @Public()
    @Post('signup')
    async signUp(@Body() signUpDto: SignUpDTO) {
        return this.authService.signUp(signUpDto.email, signUpDto.username, signUpDto.password, signUpDto.role ? signUpDto.role : 'user');
    }
  
    @Get('profile')
    @Roles(Role.Admin, Role.User)
    getProfile(@Request() req) {
      return req.user;
    }

    @Public()
    @Post('verify-email')
    async verifyEmail(
      @Body('email') email: string,
      @Body('code') code: string,
    ) {
      return this.authService.verifyEmail(email, code);
    }
  
  }
  