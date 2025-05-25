export class SignupResponseDto {
    success: boolean;
    message: string;
    user: {
      id: number;
      email: string;
      username: string;
      role: string;
    };
  }