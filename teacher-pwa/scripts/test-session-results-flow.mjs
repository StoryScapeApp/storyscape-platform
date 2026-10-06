import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';

const require = createRequire(import.meta.url);
const { createHu50Fixtures } = require('../../backend/scripts/hu50-test-fixtures.cjs');
const browserPath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const appUrl = process.env.TEST_PWA_BASE_URL || 'http://localhost:5173';

const fixtures = await createHu50Fixtures();
const browser = await chromium.launch({ executablePath: browserPath, headless: true });
try {
  const context = await browser.newContext({ baseURL: appUrl, serviceWorkers: 'block' });
  const page = await context.newPage();
  await page.goto(`/students/${fixtures.students[0].id}`);
  await page.waitForURL('**/login');

  await page.getByLabel('Email').fill(fixtures.credentials.professorA.email);
  await page.getByLabel('Password').fill(fixtures.credentials.professorA.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard');

  await page.goto(`/students/${fixtures.students[0].id}`);
  const nullGlobalBook = page.getByRole('link', { name: /hu50-book-null-global/ });
  await nullGlobalBook.waitFor();
  await page.getByText('En curso').waitFor();
  await page.getByRole('link', { name: /hu50-book-complete/ }).waitFor();
  await page.getByText('Completada').waitFor();

  await nullGlobalBook.click();
  await page.getByText('Puntaje global no disponible.').waitFor();
  await page.getByText('Comprensión literal: 55').waitFor();
  await page.getByText('Comprensión inferencial: 40').waitFor();
  await page.getByText('Nivel global: developing').waitFor();

  await page.goto(`/students/${fixtures.students[0].id}`);
  await page.getByRole('link', { name: /hu50-book-complete/ }).click();
  await page.getByText('Puntaje global: 73').waitFor();
  await page.getByText('Comprensión literal: 80').waitFor();
  await page.getByText('Comprensión inferencial: 65').waitFor();
  await page.getByText('Nivel global: intermediate').waitFor();
  await page.getByText('Actividades: 2').waitFor();
  await page.getByText('Intentos: 3').waitFor();
  await page.getByText('Pistas utilizadas: 2').waitFor();

  await page.goto(`/students/${fixtures.students[1].id}`);
  await page.getByRole('link', { name: /hu50-book-no-result/ }).click();
  await page.getByText('Resultado de comprensión aún no disponible.').waitFor();
  assert.equal(await page.getByText(/Comprensión literal:/).count(), 0);
  await page.getByText('Actividades: 0').waitFor();
  await page.getByText('Intentos: 0').waitFor();
  await page.getByText('Pistas utilizadas: 0').waitFor();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('**/login');
  await page.goto(`/sessions/${fixtures.hu50Sessions.completeSession.id}`);
  await page.waitForURL('**/login');

  await page.getByLabel('Email').fill(fixtures.credentials.professorA.email);
  await page.getByLabel('Password').fill(fixtures.credentials.professorA.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard');
  await page.route(`http://localhost:3000/sessions/${fixtures.hu50Sessions.completeSession.id}`, (route) =>
    route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
  await page.goto(`/sessions/${fixtures.hu50Sessions.completeSession.id}`);
  await page.getByText('Unable to load session.').waitFor();

  console.log('Session PWA checks passed: protected routes, real session list/navigation, complete/null results, globalScore null, counts, and API error.');
} finally {
  await browser.close();
  await fixtures.cleanup();
}
