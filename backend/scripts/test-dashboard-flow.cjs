require('dotenv/config');
const assert = require('node:assert/strict');
const baseUrl = process.env.TEST_API_BASE_URL || 'http://localhost:3000';
const credentials = { email: process.env.TEST_PROFESSOR_EMAIL, password: process.env.TEST_PROFESSOR_PASSWORD };
async function request(path, { method = 'GET', body, cookie } = {}) {
  const response = await fetch(`${baseUrl}${path}`, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { response, data: response.status === 204 ? null : await response.json() };
}
async function main() {
  assert.ok(credentials.email && credentials.password, 'Defina TEST_PROFESSOR_EMAIL y TEST_PROFESSOR_PASSWORD.');
  const unauthenticated = await request('/dashboard/summary');
  assert.equal(unauthenticated.response.status, 401);
  const login = await request('/auth/login', { method: 'POST', body: credentials });
  assert.equal(login.response.status, 200);
  const cookie = login.response.headers.get('set-cookie')?.split(';')[0];
  assert.ok(cookie, 'El inicio de sesión debe emitir la cookie del profesor.');
  const summary = await request('/dashboard/summary', { cookie });
  assert.equal(summary.response.status, 200);
  const data = summary.data;
  assert.deepEqual(Object.keys(data).sort(), ['rates', 'recent', 'reinforce', 'totals']);
  for (const key of ['students', 'sessions', 'completedSessions', 'answeredQuestions']) assert.equal(typeof data.totals[key], 'number');
  for (const key of ['firstAttempt', 'secondAttempt', 'toReinforce']) assert.ok(Number.isInteger(data.rates[key]) && data.rates[key] >= 0 && data.rates[key] <= 100);
  assert.ok(Array.isArray(data.recent) && data.recent.length <= 5);
  assert.ok(Array.isArray(data.reinforce) && data.reinforce.length <= 3);
  console.log('Flujo del panel correcto: autenticación, contrato de resumen y límites de actividad/refuerzo.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
