const { randomUUID } = require('node:crypto');
const argon2 = require('argon2');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../dist/generated/prisma/client');

async function createHu49Fixtures() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  await prisma.$connect();

  const suffix = randomUUID();
  const credentials = {
    professorA: { email: `hu49-a-${suffix}@example.test`, password: randomUUID() },
    professorB: { email: `hu49-b-${suffix}@example.test`, password: randomUUID() },
    professorEmpty: { email: `hu49-empty-${suffix}@example.test`, password: randomUUID() },
  };
  const passwordHash = async (password) => argon2.hash(password, { type: argon2.argon2id });
  const [professorA, professorB, professorEmpty] = await Promise.all([
    prisma.professor.create({ data: { email: credentials.professorA.email, passwordHash: await passwordHash(credentials.professorA.password) } }),
    prisma.professor.create({ data: { email: credentials.professorB.email, passwordHash: await passwordHash(credentials.professorB.password) } }),
    prisma.professor.create({ data: { email: credentials.professorEmpty.email, passwordHash: await passwordHash(credentials.professorEmpty.password) } }),
  ]);
  const [studentA, studentB, studentC] = await Promise.all([
    prisma.student.create({ data: { code: `HU49-A-${suffix}` } }),
    prisma.student.create({ data: { code: `HU49-B-${suffix}` } }),
    prisma.student.create({ data: { code: `HU49-C-${suffix}` } }),
  ]);
  const dates = {
    a1: new Date('2026-01-02T10:00:00.000Z'),
    a2: new Date('2026-01-10T10:00:00.000Z'),
    b1: new Date('2026-02-03T10:00:00.000Z'),
    c1: new Date('2026-03-04T10:00:00.000Z'),
  };
  const created = await Promise.all([
    prisma.readingSession.create({ data: { professorId: professorA.id, studentId: studentA.id, bookRefId: 'hu49-test-fixture', startedAt: dates.a1 } }),
    prisma.readingSession.create({ data: { professorId: professorA.id, studentId: studentA.id, bookRefId: 'hu49-test-fixture', startedAt: dates.a2 } }),
    prisma.readingSession.create({ data: { professorId: professorA.id, studentId: studentB.id, bookRefId: 'hu49-test-fixture', startedAt: dates.b1 } }),
    prisma.readingSession.create({ data: { professorId: professorB.id, studentId: studentC.id, bookRefId: 'hu49-test-fixture', startedAt: dates.c1 } }),
  ]);

  return {
    prisma,
    credentials,
    professors: [professorA, professorB, professorEmpty],
    students: [studentA, studentB, studentC],
    sessions: created,
    dates,
    async cleanup() {
      await prisma.readingSession.deleteMany({ where: { id: { in: created.map(({ id }) => id) } } });
      await prisma.student.deleteMany({ where: { id: { in: [studentA.id, studentB.id, studentC.id] } } });
      await prisma.professor.deleteMany({ where: { id: { in: [professorA.id, professorB.id, professorEmpty.id] } } });
      await prisma.$disconnect();
    },
  };
}

module.exports = { createHu49Fixtures };
