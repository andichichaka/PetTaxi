import {
  BadRequestException,
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Patch,
    Post,
    Req,
    Request,
    UnauthorizedException
  } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { SignUpDTO } from './dto/sign-up.dto';
import { Public } from './public.decorator';
  
  @Controller('auth')
  export class AuthController {
    constructor(private authService: AuthService) {}
  
    @Public()
    //@HttpCode(HttpStatus.OK)
    @Post('login')
    signIn(@Body() signInDto: LoginDTO) {
      return this.authService.signIn(signInDto.username, signInDto.password);
    }

    @Public()
    @Post('signup')
    async signUp(@Body() signUpDto: SignUpDTO) {
        return this.authService.signUp(signUpDto.email, signUpDto.username, signUpDto.password, signUpDto.role ? signUpDto.role : 'user');
    }

    @Public()
    @Post('refresh')
    async refresh(@Body() body: { refresh_token: string }) {
        if (!body.refresh_token) {
          throw new BadRequestException('Refresh token is required');
       }
       console.log(body.refresh_token)
       return this.authService.refreshToken(body.refresh_token);
     }

    @Public()
    @Post('verify-email')
    async verifyEmail(
      @Body('email') email: string,
      @Body('code') code: string,
    ) {
      return this.authService.verifyEmail(email, code);
    }
  
    @Public()
    @Post('verify')
    async verify(@Body() body: { access_token: string }) {
        if (!body.access_token) {
          throw new BadRequestException('Refresh token is required');
       }
       return this.authService.verifyToken(body.access_token);
     }

    @Patch('set-role')
    async setRole(@Req() req, @Body('role') role: string) {
      return this.authService.setRole(req.user.sub, role);
    }
  }
  