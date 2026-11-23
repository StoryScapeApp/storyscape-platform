import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async getForProfessorAndStudent(professorId: string, studentId: string) {
    const sessions = await this.prisma.readingSession.findMany({
      where: { professorId, studentId },
      orderBy: [{ startedAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        student: { select: { id: true, code: true } },
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

    if (sessions.length === 0) {
      // This same empty result covers unknown students and students without a
      // session for this professor, so another professor's records stay hidden.
      return { student: null, sessions: [] };
    }

    return {
      student: sessions[0].student,
      sessions: sessions.map((session) => ({
        sessionId: session.id,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        literalScore: session.result?.literalScore ?? null,
        inferentialScore: session.result?.inferentialScore ?? null,
        globalScore: session.result?.globalScore ?? null,
        globalLevel: session.result?.globalLevel ?? null,
      })),
    };
  }
}
