import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UnityController } from './unity.controller';
import { UnityGuard } from './unity.guard';
import { UnityService } from './unity.service';

@Module({ imports: [PrismaModule], controllers: [UnityController], providers: [UnityGuard, UnityService] })
export class UnityModule {}
