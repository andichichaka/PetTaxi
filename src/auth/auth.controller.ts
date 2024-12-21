import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Request,
    UseGuards
  } from '@nestjs/common';
  import { JwtAuthGuard } from './jwt-auth.guard';
  import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { SignUpDTO } from './dto/sign-up.dto';
import { Public } from './public.decorator';
import { Role } from 'src/roles/enum/role.enum';
import { Roles } from 'src/roles/decorator/roles.decorator';
  
  @Controller('auth')
  export class AuthController {
    constructor(private authService: AuthService) {}
  
    @HttpCode(HttpStatus.OK)
    @Public()
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
  }
  