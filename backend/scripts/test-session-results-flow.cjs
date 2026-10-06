require('dotenv/config');

const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createHu50Fixtures } = require('./hu50-test-fixtures.cjs');

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
  const { response, data } = await request('/auth/login', { method: 'POST', body: credentials });
  assert.equal(response.status, 200);
  return response.headers.get('set-cookie').split(';')[0];
}

async function main() {
  const fixtures = await createHu50Fixtures();
  try {
    const noAuth = await request(`/students/${fixtures.students[0].id}/sessions`);
    assert.equal(noAuth.response.status, 401);

    const [cookieA, cookieB] = await Promise.all([
      login(fixtures.credentials.professorA),
      login(fixtures.credentials.professorB),
    ]);
    const studentSessions = await request(`/students/${fixtures.students[0].id}/sessions`, { cookie: cookieA });
    assert.equal(studentSessions.response.status, 200);
    assert.deepEqual(studentSessions.data.map(({ id }) => id), [
      fixtures.hu50Sessions.nullableGlobalSession.id,
      fixtures.hu50Sessions.completeSession.id,
    ]);
    assert.ok(new Date(studentSessions.data[0].startedAt) > new Date(studentSessions.data[1].startedAt));
    assert.deepEqual(Object.keys(studentSessions.data[0]).sort(), ['bookRefId', 'completedAt', 'id', 'startedAt']);

    const sessionsAsOtherProfessor = await request(`/students/${fixtures.students[0].id}/sessions`, { cookie: cookieB });
    assert.equal(sessionsAsOtherProfessor.response.status, 200);
    assert.deepEqual(sessionsAsOtherProfessor.data, []);

    const full = await request(`/sessions/${fixtures.hu50Sessions.completeSession.id}`, { cookie: cookieA });
    assert.equal(full.response.status, 200);
    assert.deepEqual(full.data, {
      id: fixtures.hu50Sessions.completeSession.id,
      student: { id: fixtures.students[0].id, code: fixtures.students[0].code },
      bookRefId: 'hu50-book-complete',
      startedAt: fixtures.dates.a1.toISOString(),
      completedAt: '2026-01-02T10:30:00.000Z',
      result: { literalScore: 80, inferentialScore: 65, globalScore: 73, globalLevel: 'intermediate' },
      activitySummary: { activityCount: 2, attemptCount: 3 },
      hintSummary: { hintUsageCount: 2 },
    });

    const nullGlobal = await request(`/sessions/${fixtures.hu50Sessions.nullableGlobalSession.id}`, { cookie: cookieA });
    assert.equal(nullGlobal.response.status, 200);
    assert.deepEqual(nullGlobal.data.result, {
      literalScore: 55, inferentialScore: 40, globalScore: null, globalLevel: 'developing',
    });

    const noResult = await request(`/sessions/${fixtures.hu50Sessions.noResultSession.id}`, { cookie: cookieA });
    assert.equal(noResult.response.status, 200);
    assert.equal(noResult.data.result, null);
    assert.deepEqual(noResult.data.activitySummary, { activityCount: 0, attemptCount: 0 });
    assert.deepEqual(noResult.data.hintSummary, { hintUsageCount: 0 });

    const hidden = await request(`/sessions/${fixtures.hu50Sessions.completeSession.id}`, { cookie: cookieB });
    const missing = await request(`/sessions/${randomUUID()}`, { cookie: cookieB });
    assert.equal(hidden.response.status, 404);
    assert.equal(missing.response.status, 404);
    assert.deepEqual(hidden.data, missing.data);
    const detailNoAuth = await request(`/sessions/${fixtures.hu50Sessions.completeSession.id}`);
    assert.equal(detailNoAuth.response.status, 401);

    console.log('Session API checks passed: professor isolation, newest-first listing, generic 404, results/null, activity attempts, and hint counts.');
  } finally {
    await fixtures.cleanup();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
