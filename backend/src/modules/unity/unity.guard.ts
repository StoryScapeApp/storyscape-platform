import { CanActivate, ExecutionContext, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';

@Injectable()
export class UnityGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}
  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('UNITY_INGEST_KEY');
    if (!expected) throw new ServiceUnavailableException('La ingesta de Unity está deshabilitada: falta UNITY_INGEST_KEY.');
    const supplied = context.switchToHttp().getRequest<{ headers: { 'x-api-key'?: string } }>().headers['x-api-key'] ?? '';
    const expectedBuffer = Buffer.from(expected);
    const suppliedBuffer = Buffer.from(supplied);
    const same = expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
    if (!same) throw new UnauthorizedException('La clave de ingesta de Unity no es válida.');
    return true;
  }
}
