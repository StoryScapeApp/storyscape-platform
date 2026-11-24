require('dotenv/config');

const assert = require('node:assert/strict');
const baseUrl = process.env.TEST_API_BASE_URL || 'http://localhost:3000';
const apiKey = process.env.TEST_UNITY_API_KEY || process.env.UNITY_INGEST_KEY;
const credentials = {
  email: process.env.TEST_PROFESSOR_EMAIL,
  password: process.env.TEST_PROFESSOR_PASSWORD,
};

async function request(path, { method = 'GET', body, key = apiKey, cookie } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(key ? { 'x-api-key': key } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { response, data: response.status === 204 ? null : await response.json() };
}

async function main() {
  assert.ok(apiKey, 'Define TEST_UNITY_API_KEY o UNITY_INGEST_KEY.');
  assert.ok(credentials.email && credentials.password, 'Define TEST_PROFESSOR_EMAIL y TEST_PROFESSOR_PASSWORD.');
  const login = await request('/auth/login', { method: 'POST', body: credentials, key: undefined });
  assert.equal(login.response.status, 200);
  const cookie = login.response.headers.get('set-cookie').split(';')[0];

  const created = await request('/unity/sessions', { method: 'POST', body: { name: '  Prueba Unity  ' } });
  assert.equal(created.response.status, 201);
  const { sessionId, studentId, studentCode } = created.data;
  assert.match(studentCode, /^ALUMNO-[A-Z0-9]{6}$/);
  const reused = await request('/unity/sessions', { method: 'POST', body: { studentCode } });
  assert.equal(reused.response.status, 201);
  assert.equal(reused.data.studentId, studentId, 'Con studentCode se debe reutilizar el mismo estudiante.');
  assert.notEqual(reused.data.sessionId, sessionId);
  const unknownCode = await request('/unity/sessions', { method: 'POST', body: { studentCode: 'ALUMNO-ZZZZZZ' } });
  assert.equal(unknownCode.response.status, 404);
  const questions = [
    { chapterRefId: 'capitulo_1', questionNumber: 1, questionType: 'literal', questionText: '¿Qué vio el principito?', options: ['Un sombrero', 'Una boa', 'Una montaña'], correctLetter: 'B', attempts: [{ letter: 'B' }] },
    { chapterRefId: 'capitulo_1', questionNumber: 2, questionType: 'inferencial', questionText: '¿Qué pensaba el narrador?', options: ['Que era un sombrero', 'Que era una boa', 'Que era una flor'], correctLetter: 'B', attempts: [{ letter: 'A' }, { letter: 'B' }] },
    { chapterRefId: 'capitulo_2', questionNumber: 1, questionType: 'literal', questionText: '¿Dónde cayó el avión?', options: ['En el desierto', 'En el mar', 'En la ciudad'], correctLetter: 'A', attempts: [{ letter: 'B' }, { letter: 'C' }] },
    { chapterRefId: 'capitulo_2', questionNumber: 2, questionType: 'inferencial', questionText: '¿Qué necesitaba el principito?', options: ['Un cordero', 'Agua', 'Un avión'], correctLetter: 'A', attempts: [] },
  ];
  for (const question of questions) {
    const saved = await request(`/unity/sessions/${sessionId}/responses`, { method: 'POST', body: question });
    assert.equal(saved.response.status, 200);
  }
  const replaced = await request(`/unity/sessions/${sessionId}/responses`, { method: 'POST', body: questions[0] });
  assert.equal(replaced.response.status, 200);
  const badKey = await request('/unity/sessions', { method: 'POST', body: {}, key: `${apiKey}-invalid` });
  assert.equal(badKey.response.status, 401);
  const completed = await request(`/unity/sessions/${sessionId}/complete`, { method: 'POST' });
  assert.equal(completed.response.status, 200);
  const detail = await request(`/students/${studentId}/progress-detail?sessionId=${sessionId}`, { cookie, key: undefined });
  assert.equal(detail.response.status, 200);
  assert.deepEqual(detail.data.summary, { totalQuestions: 4, correctTotal: 2, correctFirstAttempt: 1, correctSecondAttempt: 1, toReinforce: 1 });
  assert.equal(detail.data.chapters.length, 2);
  assert.equal(detail.data.questions[0].attempts.length, 1);
  assert.equal(detail.data.questions.find((q) => q.questionNumber === 2 && q.chapterRefId === 'capitulo_2').result, 'no_answer');
  assert.match(detail.data.suggestion, /capítulo 2/i);
  const replay = await request(`/unity/sessions/${sessionId}/complete`, { method: 'POST' });
  assert.equal(replay.response.status, 200);
  const lateResponse = await request(`/unity/sessions/${sessionId}/responses`, { method: 'POST', body: questions[0] });
  assert.equal(lateResponse.response.status, 409);
  console.log('Flujo Unity correcto: creación, ingesta idempotente, puntajes, detalle docente, clave inválida y sesión completada.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
