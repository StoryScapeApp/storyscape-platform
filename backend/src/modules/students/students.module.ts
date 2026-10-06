import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [StudentsController],
  providers: [StudentsService],
})
export class StudentsModule {}
