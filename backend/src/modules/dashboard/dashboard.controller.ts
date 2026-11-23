import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from '../auth/auth.types';
import { DashboardService } from './dashboard.service';
@ApiTags('dashboard')
@ApiCookieAuth('storyscape_session')
@UseGuards(AuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}
  @Get('summary')
  @ApiOperation({ summary: 'Obtener el resumen del panel del profesor autenticado' })
  getSummary(@Req() request: AuthenticatedRequest) { return this.dashboard.getSummary(request.professor!.id); }
}
