import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { CognitoLoginDto } from './dto/cognito-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Exchange a verified Cognito ID token for the API's existing JWT.
  @Post('cognito')
  loginWithCognito(@Body() dto: CognitoLoginDto) {
    return this.authService.loginWithCognito(dto.idToken, dto.role);
  }
}
