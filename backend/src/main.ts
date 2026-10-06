import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  const config = app.get(ConfigService);
  const allowedOrigin = config.get<string>('CORS_ORIGIN');

  app.enableCsrfProtection({ trustedOrigins: [allowedOrigin!] });
  app.enableCors({ origin: allowedOrigin, credentials: true });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('StoryScape Academic Tracking API')
    .setDescription('REST API for the teacher PWA and future clients.')
    .setVersion('0.1.0')
    .addCookieAuth('storyscape_session')
    .build();
  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = config.get<number>('PORT')!;
  await app.listen(port);
}

void bootstrap();
