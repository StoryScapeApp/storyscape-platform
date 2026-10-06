import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  listForProfessorAndStudent(professorId: string, studentId: string) {
    return this.prisma.readingSession.findMany({
      where: { professorId, studentId },
      select: { id: true, bookRefId: true, startedAt: true, completedAt: true },
      orderBy: { startedAt: 'desc' },
    });
  }

  async getForProfessor(professorId: string, sessionId: string) {
    const session = await this.prisma.readingSession.findFirst({
      where: { id: sessionId, professorId },
      select: {
        id: true,
        student: { select: { id: true, code: true } },
        bookRefId: true,
        startedAt: true,
        completedAt: true,
        result: {
          select: {
            literalScore: true,
            inferentialScore: true,
            globalScore: true,
            globalLevel: true,
          },
        },
      },
    });
    if (!session) return null;

    const [activities, hintUsageCount] = await Promise.all([
      this.prisma.activityResponse.groupBy({
        by: ['activityRefId'],
        where: { sessionId },
        _count: { _all: true },
      }),
      this.prisma.hintUsage.count({ where: { sessionId } }),
    ]);

    return {
      ...session,
      activitySummary: {
        activityCount: activities.length,
        attemptCount: activities.reduce((total, activity) => total + activity._count._all, 0),
      },
      hintSummary: { hintUsageCount },
    };
  }
}
