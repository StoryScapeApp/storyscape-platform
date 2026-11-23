const { createHu50Fixtures } = require('./hu50-test-fixtures.cjs');

async function createHu51Fixtures() {
  const base = await createHu50Fixtures();
  const sharedSession = await base.prisma.readingSession.create({
    data: {
      professorId: base.professors[1].id,
      studentId: base.students[0].id,
      bookRefId: 'hu51-professor-b-only',
      startedAt: new Date('2026-01-15T10:00:00.000Z'),
    },
  });
  await base.prisma.sessionResult.create({
    data: {
      sessionId: sharedSession.id,
      literalScore: 100,
      inferentialScore: 95,
      globalScore: 98,
      globalLevel: 'advanced',
    },
  });

  return {
    ...base,
    hu51SharedSession: sharedSession,
    async cleanup() {
      await base.prisma.sessionResult.deleteMany({ where: { sessionId: sharedSession.id } });
      await base.prisma.readingSession.delete({ where: { id: sharedSession.id } });
      await base.cleanup();
    },
  };
}

module.exports = { createHu51Fixtures };
