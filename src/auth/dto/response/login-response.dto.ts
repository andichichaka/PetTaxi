export class LoginResponseDto {
    success: boolean;
    message: string;
    access_token: string;
    refresh_token: string;
    user: {
      id: number;
      email: string;
      username: string;
      role: string;
    };
  }