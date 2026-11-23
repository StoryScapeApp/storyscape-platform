import { Body, Controller, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UnityGuard } from './unity.guard';
import { UnityService } from './unity.service';
import { CreateUnitySessionDto, UnityQuestionDto } from './unity.dto';

@ApiTags('unity')
@UseGuards(UnityGuard)
@Controller('unity')
export class UnityController {
  constructor(private readonly unity: UnityService) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Crear una sesión de lectura desde Unity' })
  createSession(@Body() body: CreateUnitySessionDto) { return this.unity.createSession(body); }

  @Post('sessions/:sessionId/responses')
  @HttpCode(200)
  @ApiOperation({ summary: 'Guardar o reemplazar los intentos de una pregunta de Unity' })
  saveResponses(@Param('sessionId', new ParseUUIDPipe({ version: 'all' })) sessionId: string, @Body() body: UnityQuestionDto) { return this.unity.saveResponses(sessionId, body); }

  @Post('sessions/:sessionId/complete')
  @HttpCode(200)
  @ApiOperation({ summary: 'Completar una sesión de Unity y calcular resultados' })
  complete(@Param('sessionId', new ParseUUIDPipe({ version: 'all' })) sessionId: string) { return this.unity.complete(sessionId); }
}
