import { Controller, Get, NotFoundException, Param, ParseUUIDPipe, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from '../auth/auth.types';
import { StudentsService } from './students.service';

@ApiTags('students')
@ApiCookieAuth('storyscape_session')
@UseGuards(AuthGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  @Get()
  @ApiOperation({ summary: 'List students with reading sessions for the authenticated professor' })
  list(@Req() request: AuthenticatedRequest) {
    return this.students.listForProfessor(request.professor!.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a student with reading sessions for the authenticated professor' })
  async getById(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: 'all' })) id: string,
  ) {
    const student = await this.students.getForProfessor(request.professor!.id, id);
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    return student;
  }
}
