import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { validateEnvironment } from './config/validate-environment';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { StudentsModule } from './modules/students/students.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { ProgressModule } from './modules/progress/progress.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    PrismaModule,
    AuthModule,
    StudentsModule,
    SessionsModule,
    ProgressModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
