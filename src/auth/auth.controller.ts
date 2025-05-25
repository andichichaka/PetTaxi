import {
  BadRequestException,
  Body,
  Controller,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { SignUpDTO } from './dto/sign-up.dto';
import { Public } from './public.decorator';
import { LoginResponseDto } from './dto/response/login-response.dto';
import { SignupResponseDto } from './dto/response/signup-response.dto';
import { EmailVerifyResponseDto } from './dto/response/email-verify-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  signIn(@Body() dto: LoginDTO): Promise<LoginResponseDto> {
    return this.authService.signIn(dto.username, dto.password);
  }

  @Public()
  @Post('signup')
  signUp(@Body() dto: SignUpDTO): Promise<SignupResponseDto> {
    return this.authService.signUp(dto.email, dto.username, dto.password, dto.role ?? 'user');
  }

  @Public()
  @Post('refresh')
  refresh(@Body() body: { refresh_token: string }): Promise<{ access_token: string }> {
    if (!body.refresh_token) {
      throw new BadRequestException('Refresh token is required');
    }
    return this.authService.refreshToken(body.refresh_token);
  }

  @Public()
  @Post('verify-email')
  verifyEmail(
    @Body('email') email: string,
    @Body('code') code: string,
  ): Promise<EmailVerifyResponseDto> {
    return this.authService.verifyEmail(email, code);
  }

  @Public()
  @Post('verify')
  verify(@Body() body: { access_token: string }): Promise<{ valid: boolean }> {
    if (!body.access_token) {
      throw new BadRequestException('Access token is required');
    }
    return this.authService.verifyToken(body.access_token);
  }

  @Patch('set-role')
  setRole(@Req() req: any, @Body('role') role: string) {
    return this.authService.setRole(req.user.sub, role);
  }
}