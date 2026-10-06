import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { ProfessorIdentity } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(
    emailInput: string,
    passwordInput: string,
  ): Promise<{ professor: ProfessorIdentity; token: string }> {
    const email = emailInput.trim().toLowerCase();

    const professor = await this.prisma.professor.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true },
    });

    if (!professor || !(await argon2.verify(professor.passwordHash, passwordInput))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.jwt.signAsync(
      { sub: professor.id },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.config.getOrThrow<number>('JWT_EXPIRES_IN'),
        algorithm: 'HS256',
      },
    );

    return { professor: { id: professor.id, email: professor.email }, token };
  }

  async authenticateToken(token: string): Promise<ProfessorIdentity> {
    let subject: string;
    try {
      const payload = await this.jwt.verifyAsync<{ sub?: unknown }>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        algorithms: ['HS256'],
      });
      if (typeof payload.sub !== 'string' ||
        !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(payload.sub)) {
        throw new Error('Invalid subject');
      }
      subject = payload.sub;
    } catch {
      throw new UnauthorizedException();
    }

    const professor = await this.prisma.professor.findUnique({
      where: { id: subject },
      select: { id: true, email: true },
    });
    if (!professor) {
      throw new UnauthorizedException();
    }
    return professor;
  }
}
