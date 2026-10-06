require('dotenv/config');

const assert = require('node:assert/strict');
const { JwtService } = require('@nestjs/jwt');
const { Client } = require('pg');
const { randomUUID } = require('node:crypto');

const baseUrl = process.env.TEST_API_BASE_URL || 'http://localhost:3000';
const email = process.env.SEED_PROFESSOR_EMAIL?.trim().toLowerCase();
const password = process.env.SEED_PROFESSOR_PASSWORD;

async function request(path, { method = 'GET', body, cookie, origin, fetchSite } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Origin: origin || process.env.CORS_ORIGIN || 'http://localhost:5173',
      ...(fetchSite ? { 'Sec-Fetch-Site': fetchSite } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = response.status === 204 ? null : await response.json();
  return { response, data };
}

async function main() {
  assert.ok(email && password && process.env.JWT_SECRET, 'Seed credentials and JWT_SECRET are required');

  const unauthenticated = await request('/auth/me');
  assert.equal(unauthenticated.response.status, 401);

  const malformedInputs = [
    undefined,
    { password },
    { email },
    { email: 'not-an-email', password },
    { email: 42, password },
    { email, password: 42 },
    { email: '', password },
    { email, password: '' },
  ];
  for (const body of malformedInputs) {
    const malformed = await request('/auth/login', { method: 'POST', body });
    assert.equal(malformed.response.status, 400);
    assert.equal(malformed.response.headers.get('set-cookie'), null);
  }

  const crossSite = await request('/auth/login', {
    method: 'POST',
    body: { email, password },
    origin: 'https://untrusted.example',
    fetchSite: 'cross-site',
  });
  assert.equal(crossSite.response.status, 403);

  const wrongPassword = await request('/auth/login', {
    method: 'POST', body: { email, password: 'incorrect-password' },
  });
  const unknownEmail = await request('/auth/login', {
    method: 'POST', body: { email: 'missing@example.test', password },
  });
  assert.equal(wrongPassword.response.status, 401);
  assert.equal(unknownEmail.response.status, 401);
  assert.equal(wrongPassword.data.message, unknownEmail.data.message);
  assert.equal(wrongPassword.response.headers.get('set-cookie'), null);
  assert.equal(unknownEmail.response.headers.get('set-cookie'), null);

  const login = await request('/auth/login', {
    method: 'POST', body: { email: `  ${email.toUpperCase()}  `, password },
  });
  assert.equal(login.response.status, 200);
  assert.deepEqual(Object.keys(login.data).sort(), ['email', 'id']);
  assert.equal(login.data.email, email);
  const setCookie = login.response.headers.get('set-cookie');
  assert.match(setCookie, /^storyscape_session=/);
  assert.match(setCookie, /HttpOnly/i);
  const sameSite = process.env.COOKIE_SAME_SITE || 'lax';
  const secure = process.env.COOKIE_SECURE === 'true';
  assert.match(setCookie, new RegExp(`SameSite=${sameSite}`, 'i'));
  assert.equal(/(?:^|;)\s*Secure(?:;|$)/i.test(setCookie), secure);
  assert.match(login.response.headers.get('access-control-allow-origin'), /^http:\/\/localhost:5173$/);
  assert.equal(login.response.headers.get('access-control-allow-credentials'), 'true');
  assert.notEqual(login.response.headers.get('access-control-allow-origin'), '*');
  const cookie = setCookie.split(';')[0];

  const authenticated = await request('/auth/me', { cookie });
  assert.equal(authenticated.response.status, 200);
  assert.deepEqual(authenticated.data, login.data);

  for (const invalidCookie of [
    'storyscape_session=invalid',
    `storyscape_session=${new JwtService().sign({ sub: login.data.id }, {
      secret: process.env.JWT_SECRET, expiresIn: -1, algorithm: 'HS256',
    })}`,
    `storyscape_session=${new JwtService().sign({ sub: 'not-a-uuid' }, {
      secret: process.env.JWT_SECRET, expiresIn: 60, algorithm: 'HS256',
    })}`,
    `storyscape_session=${new JwtService().sign({ sub: randomUUID() }, {
      secret: process.env.JWT_SECRET, expiresIn: 60, algorithm: 'HS256',
    })}`,
  ]) {
    const invalid = await request('/auth/me', { cookie: invalidCookie });
    assert.equal(invalid.response.status, 401);
  }

  const database = new Client({ connectionString: process.env.DATABASE_URL });
  await database.connect();
  try {
    const result = await database.query('SELECT "passwordHash" FROM "Professor" WHERE id = $1', [login.data.id]);
    assert.match(result.rows[0].passwordHash, /^\$argon2id\$/);
    assert.notEqual(result.rows[0].passwordHash, password);
  } finally {
    await database.end();
  }

  const logout = await request('/auth/logout', { method: 'POST', cookie });
  assert.equal(logout.response.status, 204);
  assert.match(logout.response.headers.get('set-cookie'), /Max-Age=0|Expires=/i);
  assert.match(logout.response.headers.get('set-cookie'), /HttpOnly/i);
  assert.match(logout.response.headers.get('set-cookie'), new RegExp(`SameSite=${sameSite}`, 'i'));
  assert.equal(/(?:^|;)\s*Secure(?:;|$)/i.test(logout.response.headers.get('set-cookie')), secure);
  const afterLogout = await request('/auth/me');
  assert.equal(afterLogout.response.status, 401);

  console.log('Auth API checks passed: malformed inputs, valid/invalid login, me, invalid/expired cookie, logout, Argon2id, CORS/CSRF.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
