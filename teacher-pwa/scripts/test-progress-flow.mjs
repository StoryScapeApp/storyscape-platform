import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';

const require = createRequire(import.meta.url);
const { createHu51Fixtures } = require('../../backend/scripts/hu51-test-fixtures.cjs');
const browserPath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const appUrl = process.env.TEST_PWA_BASE_URL || 'http://localhost:5173';

const fixtures = await createHu51Fixtures();
const browser = await chromium.launch({ executablePath: browserPath, headless: true });
try {
  const context = await browser.newContext({ baseURL: appUrl, serviceWorkers: 'block' });
  const page = await context.newPage();
  await page.goto('/progress');
  await page.waitForURL('**/login');

  await page.getByLabel('Email').fill(fixtures.credentials.professorA.email);
  await page.getByLabel('Password').fill(fixtures.credentials.professorA.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard');

  await page.goto(`/students/${fixtures.students[0].id}`);
  const historyLink = page.getByRole('link', { name: 'Ver progreso histórico' });
  await historyLink.waitFor();
  await historyLink.click();
  await page.waitForURL(`**/progress?studentId=${fixtures.students[0].id}`);
  await page.getByRole('heading', { name: `Historial de Estudiante ${fixtures.students[0].code}` }).waitFor();

  await page.goto('/progress');
  await page.getByLabel('Student').waitFor();
  const studentSelect = page.getByLabel('Student');
  await studentSelect.selectOption(fixtures.students[0].id);
  await page.getByRole('heading', { name: `Historial de Estudiante ${fixtures.students[0].code}` }).waitFor();
  const timeline = page.locator('ol > li');
  assert.equal(await timeline.count(), 2);
  const firstSession = await timeline.nth(0).innerText();
  const secondSession = await timeline.nth(1).innerText();
  assert.match(firstSession, /Comprensión literal: 80/);
  assert.match(secondSession, /Comprensión literal: 55/);
  assert.match(secondSession, /Puntaje global no disponible\./);
  assert.equal(await page.getByText('Comprensión literal: 100').count(), 0);

  await studentSelect.selectOption(fixtures.students[1].id);
  await page.getByText('No hay suficientes sesiones para mostrar una evolución histórica.').waitFor();
  await page.getByText('Resultado de comprensión no disponible.').waitFor();
  assert.equal(await page.locator('ol > li').count(), 1);

  await page.goto(`/progress?studentId=${fixtures.students[2].id}`);
  await page.getByText('No hay sesiones registradas para este estudiante.').waitFor();
  assert.equal(await page.getByText(`Estudiante ${fixtures.students[2].code}`).count(), 0);

  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('**/login');
  await page.getByLabel('Email').fill(fixtures.credentials.professorB.email);
  await page.getByLabel('Password').fill(fixtures.credentials.professorB.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard');
  await page.goto('/progress');
  await page.getByLabel('Student').waitFor();
  await page.getByLabel('Student').selectOption(fixtures.students[0].id);
  await page.getByRole('heading', { name: `Historial de Estudiante ${fixtures.students[0].code}` }).waitFor();
  assert.equal(await page.locator('ol > li').count(), 1);
  await page.getByText('Comprensión literal: 100').waitFor();
  assert.equal(await page.getByText('Comprensión literal: 80').count(), 0);

  await page.route(`**/students/${fixtures.students[0].id}/progress`, (route) =>
    route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
  await page.reload();
  await page.getByText('Unable to load student progress.').waitFor();
  await page.unroute(`**/students/${fixtures.students[0].id}/progress`);

  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('**/login');
  await page.goto(`/progress?studentId=${fixtures.students[0].id}`);
  await page.waitForURL('**/login');

  console.log('Progress PWA checks passed: protected route, real selection, empty/single/multiple history, order, null result/global score, and professor isolation.');
} finally {
  await browser.close();
  await fixtures.cleanup();
}
