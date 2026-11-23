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

  async getDetailForProfessor(professorId: string, studentId: string, sessionId?: string) {
    const session = await this.prisma.readingSession.findFirst({
      where: { professorId, studentId, ...(sessionId ? { id: sessionId } : {}) },
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true, startedAt: true, completedAt: true,
        student: { select: { id: true, code: true, name: true } },
        activityResponses: { orderBy: [{ chapterRefId: 'asc' }, { questionNumber: 'asc' }, { attemptNumber: 'asc' }] },
      },
    });
    if (!session) return { student: null, session: null, summary: { totalQuestions: 0, correctTotal: 0, correctFirstAttempt: 0, correctSecondAttempt: 0, toReinforce: 0 }, chapters: [], questions: [], suggestion: null };
    const grouped = new Map<string, typeof session.activityResponses>();
    for (const row of session.activityResponses) {
      const key = `${row.chapterRefId ?? row.activityRefId}:${row.questionNumber ?? ''}`;
      grouped.set(key, [...(grouped.get(key) ?? []), row]);
    }
    const title = (ref: string) => ref.replace(/^capitulo_/, 'Capítulo ').replace(/_/g, ' ');
    const questions = [...grouped.values()].map((rows) => {
      const first = rows[0];
      const correct = rows.find((row) => row.isCorrect);
      const result = !rows.some((row) => row.chosenLetter) ? 'no_answer' : correct ? (correct.attemptNumber === 1 ? 'first_attempt' : 'second_attempt') : 'incorrect';
      const options = Array.isArray(first.options) ? first.options as string[] : [];
      return {
        chapterRefId: first.chapterRefId ?? first.activityRefId.split(':q')[0], chapterTitle: title(first.chapterRefId ?? first.activityRefId.split(':q')[0]),
        questionNumber: first.questionNumber ?? Number(first.activityRefId.split(':q')[1] ?? 0), questionType: first.questionType,
        questionText: first.questionText, correctLetter: first.correctLetter,
        correctOptionText: first.correctLetter ? options[['A', 'B', 'C'].indexOf(first.correctLetter)] ?? null : null,
        attempts: rows.map((row) => ({ attemptNumber: row.attemptNumber, letter: row.chosenLetter, isCorrect: row.isCorrect })), result,
      };
    }).sort((a, b) => a.chapterRefId.localeCompare(b.chapterRefId) || a.questionNumber - b.questionNumber);
    const chapters = new Map<string, { chapterRefId: string; title: string; correct: number; total: number; questions: { questionNumber: number; result: string }[] }>();
    for (const q of questions) {
      const chapter = chapters.get(q.chapterRefId) ?? { chapterRefId: q.chapterRefId, title: q.chapterTitle, correct: 0, total: 0, questions: [] };
      chapter.total++; if (q.result === 'first_attempt' || q.result === 'second_attempt') chapter.correct++;
      chapter.questions.push({ questionNumber: q.questionNumber, result: q.result }); chapters.set(q.chapterRefId, chapter);
    }
    const failed = questions.filter((q) => q.result === 'incorrect');
    const failedByChapter = new Map<string, typeof failed>();
    failed.forEach((q) => failedByChapter.set(q.chapterRefId, [...(failedByChapter.get(q.chapterRefId) ?? []), q]));
    const focus = [...failedByChapter.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))[0];
    const suggestion = focus ? `Repasar con el estudiante el ${title(focus[0]).toLowerCase()}: la pregunta «${focus[1][0].questionText ?? 'sin texto'}» fue incorrecta en ambos intentos.` : null;
    const correctFirstAttempt = questions.filter((q) => q.result === 'first_attempt').length;
    const correctSecondAttempt = questions.filter((q) => q.result === 'second_attempt').length;
    return {
      student: session.student, session: { id: session.id, startedAt: session.startedAt, completedAt: session.completedAt },
      summary: { totalQuestions: questions.length, correctTotal: correctFirstAttempt + correctSecondAttempt, correctFirstAttempt, correctSecondAttempt, toReinforce: failed.length },
      chapters: [...chapters.values()].sort((a, b) => a.chapterRefId.localeCompare(b.chapterRefId)), questions, suggestion,
    };
  }
}
