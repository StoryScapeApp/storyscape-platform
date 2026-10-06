import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const email = process.env.SEED_PROFESSOR_EMAIL;
const password = process.env.SEED_PROFESSOR_PASSWORD;
assert.ok(email && password, 'Seed professor credentials are required');

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});

try {
  const context = await browser.newContext({ baseURL: process.env.TEST_PWA_BASE_URL || 'http://localhost:5173' });
  const page = await context.newPage();

  for (const path of ['/', '/dashboard', '/students', '/students/example', '/sessions/example', '/progress']) {
    await page.goto(path);
    await page.waitForURL('**/login');
    assert.equal(new URL(page.url()).pathname, '/login');
    assert.equal(await page.getByRole('heading', { name: 'Dashboard' }).count(), 0);
  }

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('incorrect-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('alert').waitFor();
  assert.equal(new URL(page.url()).pathname, '/login');

  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard');
  await page.getByRole('heading', { name: 'Dashboard' }).waitFor();
  const cookies = await context.cookies();
  const sessionCookie = cookies.find((cookie) => cookie.name === 'storyscape_session');
  assert.equal(sessionCookie?.httpOnly, true);
  assert.equal(sessionCookie?.sameSite?.toLowerCase(), (process.env.COOKIE_SAME_SITE || 'lax').toLowerCase());
  assert.equal(sessionCookie?.secure, process.env.COOKIE_SECURE === 'true');
  assert.equal((await page.evaluate(() => document.cookie)).includes('storyscape_session'), false);

  await page.reload();
  await page.getByRole('heading', { name: 'Dashboard' }).waitFor();
  assert.equal(new URL(page.url()).pathname, '/dashboard');

  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('**/login');
  await page.goto('/progress');
  await page.waitForURL('**/login');
  assert.equal(new URL(page.url()).pathname, '/login');

  console.log('PWA auth checks passed: protected routes, invalid/valid login, refresh, HttpOnly cookie, logout.');
} finally {
  await browser.close();
}
