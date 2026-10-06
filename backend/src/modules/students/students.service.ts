import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface StudentSummary {
  id: string;
  code: string;
  sessionCount: number;
  lastSessionAt: Date;
}

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForProfessor(professorId: string): Promise<StudentSummary[]> {
    const aggregates = await this.prisma.readingSession.groupBy({
      by: ['studentId'],
      where: { professorId },
      _count: { _all: true },
      _max: { startedAt: true },
    });

    if (aggregates.length === 0) return [];

    const students = await this.prisma.student.findMany({
      where: { id: { in: aggregates.map(({ studentId }) => studentId) } },
      select: { id: true, code: true },
    });
    const metrics = new Map(aggregates.map((aggregate) => [aggregate.studentId, aggregate]));

    return students
      .map((student) => {
        const aggregate = metrics.get(student.id)!;
        return {
          id: student.id,
          code: student.code,
          sessionCount: aggregate._count._all,
          lastSessionAt: aggregate._max.startedAt!,
        };
      })
      .sort((left, right) => left.code.localeCompare(right.code));
  }

  async getForProfessor(professorId: string, studentId: string): Promise<StudentSummary | null> {
    const aggregate = await this.prisma.readingSession.groupBy({
      by: ['studentId'],
      where: { professorId, studentId },
      _count: { _all: true },
      _max: { startedAt: true },
    });
    if (aggregate.length === 0) return null;

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, code: true },
    });
    if (!student) return null;

    return {
      id: student.id,
      code: student.code,
      sessionCount: aggregate[0]._count._all,
      lastSessionAt: aggregate[0]._max.startedAt!,
    };
  }
}
