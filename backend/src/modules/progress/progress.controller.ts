import { Controller, Get, Param, ParseUUIDPipe, Query, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from '../auth/auth.types';
import { ProgressService } from './progress.service';

@ApiTags('progress')
@ApiCookieAuth('storyscape_session')
@UseGuards(AuthGuard)
@Controller('students')
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Get(':studentId/progress')
  @ApiOperation({ summary: 'Get chronological comprehension results for a student’s sessions with the authenticated professor' })
  getStudentProgress(
    @Req() request: AuthenticatedRequest,
    @Param('studentId', new ParseUUIDPipe({ version: 'all' })) studentId: string,
  ) {
    return this.progress.getForProfessorAndStudent(request.professor!.id, studentId);
  }

  @Get(':studentId/progress-detail')
  @ApiOperation({ summary: 'Obtener el detalle de respuestas y resultados de un estudiante' })
  getStudentProgressDetail(
    @Req() request: AuthenticatedRequest,
    @Param('studentId', new ParseUUIDPipe({ version: 'all' })) studentId: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.progress.getDetailForProfessor(request.professor!.id, studentId, sessionId);
  }
}
