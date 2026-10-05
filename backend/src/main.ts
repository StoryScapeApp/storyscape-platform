import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const allowedOrigin = config.get<string>('CORS_ORIGIN');

  app.enableCors({ origin: allowedOrigin });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('StoryScape Academic Tracking API')
    .setDescription('REST API for the teacher PWA and future clients.')
    .setVersion('0.1.0')
    .build();
  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = config.get<number>('PORT')!;
  await app.listen(port);
}

void bootstrap();
