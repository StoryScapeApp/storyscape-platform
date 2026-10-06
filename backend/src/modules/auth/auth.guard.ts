import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { parse } from 'cookie';
import { AuthService } from './auth.service';
import { AUTH_COOKIE_NAME } from './auth.constants';
import { AuthenticatedRequest } from './auth.types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = parse(request.headers.cookie ?? '')[AUTH_COOKIE_NAME];
    if (!token) {
      throw new UnauthorizedException();
    }
    request.professor = await this.auth.authenticateToken(token);
    return true;
  }
}
