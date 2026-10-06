require('dotenv/config');

const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createHu49Fixtures } = require('./hu49-test-fixtures.cjs');

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
  const setCookie = response.headers.get('set-cookie');
  assert.ok(setCookie?.startsWith('storyscape_session='));
  return { cookie: setCookie.split(';')[0], professor: data };
}

async function main() {
  const fixtures = await createHu49Fixtures();
  try {
    const unauthorizedList = await request('/students');
    assert.equal(unauthorizedList.response.status, 401);
    const [authA, authB, authEmpty] = await Promise.all([
      login(fixtures.credentials.professorA),
      login(fixtures.credentials.professorB),
      login(fixtures.credentials.professorEmpty),
    ]);

    const listA = await request('/students', { cookie: authA.cookie });
    assert.equal(listA.response.status, 200);
    assert.deepEqual(listA.data.map(({ code }) => code).sort(), [fixtures.students[0].code, fixtures.students[1].code].sort());
    const summaryA = listA.data.find(({ id }) => id === fixtures.students[0].id);
    assert.equal(summaryA.sessionCount, 2);
    assert.equal(summaryA.lastSessionAt, fixtures.dates.a2.toISOString());
    assert.deepEqual(Object.keys(summaryA).sort(), ['code', 'id', 'lastSessionAt', 'sessionCount']);

    const listB = await request('/students', { cookie: authB.cookie });
    assert.equal(listB.response.status, 200);
    assert.deepEqual(listB.data.map(({ code }) => code), [fixtures.students[2].code]);
    assert.equal(listB.data[0].sessionCount, 1);
    assert.equal(listB.data[0].lastSessionAt, fixtures.dates.c1.toISOString());

    const listEmpty = await request('/students', { cookie: authEmpty.cookie });
    assert.equal(listEmpty.response.status, 200);
    assert.deepEqual(listEmpty.data, []);

    const allowedDetail = await request(`/students/${fixtures.students[0].id}`, { cookie: authA.cookie });
    assert.equal(allowedDetail.response.status, 200);
    assert.equal(allowedDetail.data.sessionCount, 2);
    assert.equal(allowedDetail.data.lastSessionAt, fixtures.dates.a2.toISOString());

    const forbiddenDetail = await request(`/students/${fixtures.students[2].id}`, { cookie: authA.cookie });
    assert.equal(forbiddenDetail.response.status, 404);
    const missingDetail = await request(`/students/${randomUUID()}`, { cookie: authA.cookie });
    assert.equal(missingDetail.response.status, 404);
    assert.deepEqual(forbiddenDetail.data, missingDetail.data);
    const invalidId = await request('/students/not-a-uuid', { cookie: authA.cookie });
    assert.equal(invalidId.response.status, 400);

    console.log('Student API checks passed: authentication, professor isolation, empty list, per-professor metrics, authorized/hidden/missing details.');
  } finally {
    await fixtures.cleanup();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
