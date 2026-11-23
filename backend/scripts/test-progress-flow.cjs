require('dotenv/config');

const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createHu51Fixtures } = require('./hu51-test-fixtures.cjs');

const baseUrl = process.env.TEST_API_BASE_URL || 'http://localhost:3000';

async function request(path, { method = 'GET', body, cookie } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { response, data: response.status === 204 ? null : await response.json() };
}

async function login(credentials) {
  const { response } = await request('/auth/login', { method: 'POST', body: credentials });
  assert.equal(response.status, 200);
  return response.headers.get('set-cookie').split(';')[0];
}

async function main() {
  const fixtures = await createHu51Fixtures();
  try {
    const path = `/students/${fixtures.students[0].id}/progress`;
    const unauthenticated = await request(path);
    assert.equal(unauthenticated.response.status, 401);

    const [cookieA, cookieB] = await Promise.all([
      login(fixtures.credentials.professorA),
      login(fixtures.credentials.professorB),
    ]);
    const progressA = await request(path, { cookie: cookieA });
    assert.equal(progressA.response.status, 200);
    assert.deepEqual(progressA.data.student, { id: fixtures.students[0].id, code: fixtures.students[0].code });
    assert.deepEqual(progressA.data.sessions, [
      {
        sessionId: fixtures.hu50Sessions.completeSession.id,
        startedAt: fixtures.dates.a1.toISOString(),
        completedAt: '2026-01-02T10:30:00.000Z',
        literalScore: 80,
        inferentialScore: 65,
        globalScore: 73,
        globalLevel: 'intermediate',
      },
      {
        sessionId: fixtures.hu50Sessions.nullableGlobalSession.id,
        startedAt: fixtures.dates.a2.toISOString(),
        completedAt: null,
        literalScore: 55,
        inferentialScore: 40,
        globalScore: null,
        globalLevel: 'developing',
      },
    ]);
    assert.equal(progressA.data.sessions.length, 2);
    assert.ok(new Date(progressA.data.sessions[0].startedAt) < new Date(progressA.data.sessions[1].startedAt));
    assert.equal(progressA.data.sessions.some(({ sessionId }) => sessionId === fixtures.hu51SharedSession.id), false);

    const singleSession = await request(`/students/${fixtures.students[1].id}/progress`, { cookie: cookieA });
    assert.equal(singleSession.response.status, 200);
    assert.equal(singleSession.data.sessions.length, 1);
    assert.deepEqual(singleSession.data.sessions[0], {
      sessionId: fixtures.hu50Sessions.noResultSession.id,
      startedAt: fixtures.dates.b1.toISOString(),
      completedAt: null,
      literalScore: null,
      inferentialScore: null,
      globalScore: null,
      globalLevel: null,
    });

    const emptyForOtherProfessor = await request(`/students/${fixtures.students[2].id}/progress`, { cookie: cookieA });
    const emptyForMissingStudent = await request(`/students/${randomUUID()}/progress`, { cookie: cookieA });
    assert.equal(emptyForOtherProfessor.response.status, 200);
    assert.deepEqual(emptyForOtherProfessor.data, { student: null, sessions: [] });
    assert.deepEqual(emptyForOtherProfessor.data, emptyForMissingStudent.data);

    const invalidStudentId = await request('/students/not-a-valid-uuid/progress', { cookie: cookieA });
    assert.equal(invalidStudentId.response.status, 400);

    const progressB = await request(path, { cookie: cookieB });
    assert.equal(progressB.response.status, 200);
    assert.deepEqual(progressB.data.student, { id: fixtures.students[0].id, code: fixtures.students[0].code });
    assert.deepEqual(progressB.data.sessions, [{
      sessionId: fixtures.hu51SharedSession.id,
      startedAt: '2026-01-15T10:00:00.000Z',
      completedAt: null,
      literalScore: 100,
      inferentialScore: 95,
      globalScore: 98,
      globalLevel: 'advanced',
    }]);

    console.log('Progress API checks passed: authentication, empty/single/multiple sessions, chronological order, null results, null globalScore, and professor isolation.');
  } finally {
    await fixtures.cleanup();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
