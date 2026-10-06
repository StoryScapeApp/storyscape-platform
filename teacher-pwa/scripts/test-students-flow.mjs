import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';

const require = createRequire(import.meta.url);
const { createHu49Fixtures } = require('../../backend/scripts/hu49-test-fixtures.cjs');
const browserPath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const appUrl = process.env.TEST_PWA_BASE_URL || 'http://localhost:5173';

const fixtures = await createHu49Fixtures();
const browser = await chromium.launch({ executablePath: browserPath, headless: true });
try {
  const context = await browser.newContext({ baseURL: appUrl, serviceWorkers: 'block' });
  const page = await context.newPage();
  await page.goto('/students');
  await page.waitForURL('**/login');
  assert.equal(new URL(page.url()).pathname, '/login');

  await page.getByLabel('Email').fill(fixtures.credentials.professorA.email);
  await page.getByLabel('Password').fill(fixtures.credentials.professorA.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard');

  let delayedApiRequest = false;
  let releaseListResponse;
  const listResponseGate = new Promise((resolve) => { releaseListResponse = resolve; });
  await page.route('http://localhost:3000/students', async (route) => {
    delayedApiRequest = true;
    await listResponseGate;
    await route.continue();
  });
  const studentsNavigation = page.goto('/students', { waitUntil: 'commit' });
  await page.getByText('Loading students...').waitFor();
  assert.equal(delayedApiRequest, true);
  releaseListResponse();
  await studentsNavigation;
  await page.getByRole('link', { name: `Estudiante ${fixtures.students[0].code}` }).waitFor();
  assert.equal(await page.getByText(`Estudiante ${fixtures.students[2].code}`).count(), 0);
  assert.equal(await page.getByText('Sessions: 2').count(), 1);
  await page.getByRole('link', { name: `Estudiante ${fixtures.students[0].code}` }).click();
  await page.getByText('Los resultados detallados se incorporarán en la siguiente etapa.').waitFor();
  assert.equal(await page.getByText(`Estudiante ${fixtures.students[0].code}`).count(), 1);
  assert.equal(await page.getByText('Sessions: 2').count(), 1);

  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('**/login');
  await page.getByLabel('Email').fill(fixtures.credentials.professorEmpty.email);
  await page.getByLabel('Password').fill(fixtures.credentials.professorEmpty.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard');
  await page.goto('/students');
  await page.getByText('No hay estudiantes con sesiones registradas.').waitFor();

  await page.route('http://localhost:3000/students', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
  await page.reload();
  await page.getByText('Unable to load students. Please try again.').waitFor();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('**/login');
  await page.goto('/students');
  await page.waitForURL('**/login');
  assert.equal(await page.getByRole('heading', { name: 'Students' }).count(), 0);

  console.log('Student PWA checks passed: protected route, loading, real API list/detail, empty state, API error, logout, no invented personal data.');
} finally {
  await browser.close();
  await fixtures.cleanup();
}
