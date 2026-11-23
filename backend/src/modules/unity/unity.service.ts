import { ConflictException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUnitySessionDto, UnityQuestionDto } from './unity.dto';

@Injectable()
export class UnityService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  private async professor() {
    const email = this.config.get<string>('UNITY_PROFESSOR_EMAIL');
    if (!email) throw new ServiceUnavailableException('La ingesta de Unity está deshabilitada: falta UNITY_PROFESSOR_EMAIL.');
    const professor = await this.prisma.professor.findUnique({ where: { email } });
    if (!professor) throw new ServiceUnavailableException('El profesor configurado en UNITY_PROFESSOR_EMAIL no existe.');
    return professor;
  }

  async createSession(body: CreateUnitySessionDto) {
    const professor = await this.professor();
    let student;
    for (let attempt = 0; attempt < 20; attempt++) {
      const code = `ALUMNO-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      try { student = await this.prisma.student.create({ data: { code, name: body.name?.trim() || null } }); break; }
      catch (error) {
        if (!(error instanceof Error) || !('code' in error) || error.code !== 'P2002') throw error;
      }
    }
    if (!student) throw new ConflictException('No se pudo generar un código único para el estudiante. Inténtalo de nuevo.');
    const session = await this.prisma.readingSession.create({ data: { professorId: professor.id, studentId: student.id, bookRefId: body.bookRefId ?? 'el-principito' } });
    return { sessionId: session.id, studentId: student.id, studentCode: student.code };
  }

  async saveResponses(sessionId: string, body: UnityQuestionDto) {
    const session = await this.prisma.readingSession.findUnique({ where: { id: sessionId }, select: { id: true, completedAt: true } });
    if (!session) throw new NotFoundException('No existe la sesión indicada.');
    if (session.completedAt) throw new ConflictException('La sesión ya está completada y no admite cambios.');
    const activityRefId = `${body.chapterRefId}:q${body.questionNumber}`;
    await this.prisma.$transaction(async (tx) => {
      await tx.activityResponse.deleteMany({ where: { sessionId, activityRefId } });
      const attempts = body.attempts.length ? body.attempts : [{ letter: null as unknown as string }];
      await tx.activityResponse.createMany({ data: attempts.map((attempt, index) => ({
        sessionId, activityRefId, attemptNumber: index + 1, chosenLetter: attempt.letter,
        chapterRefId: body.chapterRefId, questionNumber: body.questionNumber, questionType: body.questionType,
        questionText: body.questionText, options: body.options, correctLetter: body.correctLetter,
        isCorrect: attempt.letter === body.correctLetter,
      })) });
    });
    return { message: 'Respuestas guardadas correctamente.' };
  }

  async complete(sessionId: string) {
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.readingSession.findUnique({ where: { id: sessionId }, select: { id: true, completedAt: true } });
      if (!session) throw new NotFoundException('No existe la sesión indicada.');
      const responses = await tx.activityResponse.findMany({ where: { sessionId }, orderBy: { attemptNumber: 'asc' } });
      const groups = new Map<string, typeof responses>();
      responses.forEach((row) => groups.set(row.activityRefId, [...(groups.get(row.activityRefId) ?? []), row]));
      const scores: Record<string, number[]> = { literal: [], inferencial: [] };
      for (const rows of groups.values()) {
        const type = rows[0].questionType;
        if (type !== 'literal' && type !== 'inferencial') continue;
        const correct = rows.find((row) => row.isCorrect);
        scores[type].push(correct ? (correct.attemptNumber === 1 ? 100 : 50) : 0);
      }
      const completedAt = session.completedAt ?? new Date();
      if (groups.size === 0) {
        // Sesión sin preguntas respondidas (el niño no llegó a un quiz): se cierra sin puntajes inventados.
        await tx.readingSession.update({ where: { id: sessionId }, data: { completedAt } });
        return { sessionId, completedAt, result: null };
      }
      const average = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
      const literalScore = average(scores.literal), inferentialScore = average(scores.inferencial);
      // El global promedia solo los tipos que tienen preguntas (si solo hubo literales, no se divide a la mitad)
      const tipos = [scores.literal, scores.inferencial].filter((v) => v.length > 0).map(average);
      const globalScore = Math.round(tipos.reduce((a, b) => a + b, 0) / tipos.length);
      const globalLevel = globalScore >= 80 ? 'advanced' : globalScore >= 50 ? 'intermediate' : 'developing';
      const result = await tx.sessionResult.upsert({
        where: { sessionId }, create: { sessionId, literalScore, inferentialScore, globalScore, globalLevel },
        update: { literalScore, inferentialScore, globalScore, globalLevel },
      });
      await tx.readingSession.update({ where: { id: sessionId }, data: { completedAt } });
      return { sessionId, completedAt, result };
    });
  }
}
