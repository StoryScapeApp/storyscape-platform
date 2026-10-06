const { createHu49Fixtures } = require('./hu49-test-fixtures.cjs');

async function createHu50Fixtures() {
  const base = await createHu49Fixtures();
  const prisma = base.prisma;
  const [completeSession, nullableGlobalSession, noResultSession] = base.sessions;

  await Promise.all([
    prisma.readingSession.update({
      where: { id: completeSession.id },
      data: { bookRefId: 'hu50-book-complete', completedAt: new Date('2026-01-02T10:30:00.000Z') },
    }),
    prisma.readingSession.update({ where: { id: nullableGlobalSession.id }, data: { bookRefId: 'hu50-book-null-global' } }),
    prisma.readingSession.update({ where: { id: noResultSession.id }, data: { bookRefId: 'hu50-book-no-result' } }),
  ]);

  await Promise.all([
    prisma.sessionResult.create({
      data: {
        sessionId: completeSession.id,
        literalScore: 80,
        inferentialScore: 65,
        globalScore: 73,
        globalLevel: 'intermediate',
      },
    }),
    prisma.sessionResult.create({
      data: {
        sessionId: nullableGlobalSession.id,
        literalScore: 55,
        inferentialScore: 40,
        globalScore: null,
        globalLevel: 'developing',
      },
    }),
  ]);

  await Promise.all([
    prisma.activityResponse.createMany({
      data: [
        { sessionId: completeSession.id, activityRefId: 'hu50-activity-1', attemptNumber: 1, isCorrect: false },
        { sessionId: completeSession.id, activityRefId: 'hu50-activity-1', attemptNumber: 2, isCorrect: true },
        { sessionId: completeSession.id, activityRefId: 'hu50-activity-2', attemptNumber: 1, isCorrect: true },
      ],
    }),
    prisma.hintUsage.createMany({
      data: [
        { sessionId: completeSession.id, hintRefId: 'hu50-hint-1', activityRefId: 'hu50-activity-1' },
        { sessionId: completeSession.id, hintRefId: 'hu50-hint-2', activityRefId: 'hu50-activity-2' },
      ],
    }),
  ]);

  return {
    ...base,
    hu50Sessions: { completeSession, nullableGlobalSession, noResultSession, otherProfessorSession: base.sessions[3] },
    async cleanup() {
      const sessionIds = base.sessions.map(({ id }) => id);
      await prisma.activityResponse.deleteMany({ where: { sessionId: { in: sessionIds } } });
      await prisma.hintUsage.deleteMany({ where: { sessionId: { in: sessionIds } } });
      await prisma.sessionResult.deleteMany({ where: { sessionId: { in: sessionIds } } });
      await base.cleanup();
    },
  };
}

module.exports = { createHu50Fixtures };
