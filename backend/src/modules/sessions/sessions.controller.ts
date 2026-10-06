import { Controller, Get, NotFoundException, Param, ParseUUIDPipe, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from '../auth/auth.types';
import { SessionsService } from './sessions.service';

@ApiTags('sessions')
@ApiCookieAuth('storyscape_session')
@UseGuards(AuthGuard)
@Controller()
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Get('students/:studentId/sessions')
  @ApiOperation({ summary: 'List reading sessions for the authenticated professor and student' })
  listForStudent(
    @Req() request: AuthenticatedRequest,
    @Param('studentId', new ParseUUIDPipe({ version: 'all' })) studentId: string,
  ) {
    return this.sessions.listForProfessorAndStudent(request.professor!.id, studentId);
  }

  @Get('sessions/:sessionId')
  @ApiOperation({ summary: 'Get a reading session and its comprehension result for the authenticated professor' })
  async getById(
    @Req() request: AuthenticatedRequest,
    @Param('sessionId', new ParseUUIDPipe({ version: 'all' })) sessionId: string,
  ) {
    const session = await this.sessions.getForProfessor(request.professor!.id, sessionId);
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }
}
