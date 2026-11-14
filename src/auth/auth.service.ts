import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  async signup(dto: SignupDto) {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new ConflictException('Email is already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: { email, passwordHash, role: 'CUSTOMER' },
    });
    const accessToken = await this.issueApiToken(user);
    return { message: 'User registered successfully', accessToken, user: this.safeUser(user) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (!user?.passwordHash || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return {
      message: 'Login successful',
      accessToken: await this.issueApiToken(user),
      user: this.safeUser(user),
    };
  }

  async loginWithCognito(idToken: string, requestedRole: 'CUSTOMER' | 'TAILOR' = 'CUSTOMER') {
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const clientId = process.env.COGNITO_APP_CLIENT_ID;
    if (!userPoolId || !clientId) {
      throw new ServiceUnavailableException('Cognito login is not configured on the API');
    }

    let claims: Record<string, unknown>;
    try {
      const verifier = CognitoJwtVerifier.create({
        userPoolId,
        tokenUse: 'id',
        clientId,
      });
      claims = await verifier.verify(idToken) as unknown as Record<string, unknown>;
    } catch {
      throw new UnauthorizedException('Cognito ID token is invalid or expired');
    }

    const sub = typeof claims.sub === 'string' ? claims.sub : '';
    const email = typeof claims.email === 'string' ? claims.email.trim().toLowerCase() : '';
    const verified = claims.email_verified === true || claims.email_verified === 'true';
    const fullName = typeof claims.name === 'string' ? claims.name.trim() : undefined;
    if (!sub || !email || !verified) {
      throw new UnauthorizedException('Cognito must provide a verified email address');
    }

    let user = await this.prisma.user.findUnique({ where: { cognitoSub: sub } });
    if (!user) {
      // Link a verified Google email to an existing local account instead of creating duplicates.
      const existingByEmail = await this.prisma.user.findUnique({ where: { email } });
      if (existingByEmail?.cognitoSub && existingByEmail.cognitoSub !== sub) {
        throw new ConflictException('This email is already linked to another social identity');
      }
      if (existingByEmail) {
        user = await this.prisma.user.update({
          where: { id: existingByEmail.id },
          data: { cognitoSub: sub, ...(fullName && !existingByEmail.fullName ? { fullName } : {}) },
        });
      } else {
        user = await this.prisma.user.create({
          data: { email, cognitoSub: sub, fullName, passwordHash: null, role: requestedRole },
        });
      }
    } else if (fullName && !user.fullName) {
      user = await this.prisma.user.update({ where: { id: user.id }, data: { fullName } });
    }

    return {
      message: 'Google sign-in successful',
      accessToken: await this.issueApiToken(user),
      user: this.safeUser(user),
    };
  }

  private issueApiToken(user: { id: number; email: string; role: string }) {
    return this.jwtService.signAsync({ sub: user.id, email: user.email, role: user.role });
  }

  private safeUser(user: {
    id: number; fullName?: string | null; email: string; phoneNumber?: string | null; role: string;
  }) {
    return { id: user.id, fullName: user.fullName ?? null, email: user.email, phoneNumber: user.phoneNumber ?? null, role: user.role };
  }
}
