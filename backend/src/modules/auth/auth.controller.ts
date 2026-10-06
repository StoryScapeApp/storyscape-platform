import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';
import { ApiBadRequestResponse, ApiCookieAuth, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AUTH_COOKIE_NAME } from './auth.constants';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { AuthenticatedRequest, ProfessorIdentity } from './auth.types';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
    private readonly adapterHost: HttpAdapterHost,
  ) {}

  private cookieOptions() {
    return {
      path: '/',
      httpOnly: true,
      secure: this.config.getOrThrow<boolean>('COOKIE_SECURE'),
      sameSite: this.config.getOrThrow<'lax' | 'strict' | 'none'>('COOKIE_SAME_SITE'),
    } as const;
  }

  @Post('login')
  @HttpCode(200)
  @ApiBadRequestResponse({ description: 'Malformed login input.' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: unknown,
  ): Promise<ProfessorIdentity> {
    const { professor, token } = await this.auth.login(body.email, body.password);
    this.adapterHost.httpAdapter.setCookie(response, AUTH_COOKIE_NAME, token, {
      ...this.cookieOptions(),
      maxAge: this.config.getOrThrow<number>('JWT_EXPIRES_IN'),
    });
    return professor;
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) response: unknown): void {
    this.adapterHost.httpAdapter.clearCookie(response, AUTH_COOKIE_NAME, this.cookieOptions());
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiUnauthorizedResponse({ description: 'Authentication required.' })
  me(@Req() request: AuthenticatedRequest): ProfessorIdentity {
    return request.professor!;
  }
}
