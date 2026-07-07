import { test, expect } from '@playwright/test';

const TEST_EMAIL = `e2e-${Date.now()}@allright.test`;
const TEST_PASSWORD = 'TestPass123!';

test.describe('Mobile Auth — Galaxy S25 viewport', () => {
  test.beforeAll(async ({ request }) => {
    await request.post('/users', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
  });

  test('renders login UI in mobile frame', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('email')).toBeVisible();
    await expect(page.getByTestId('password')).toBeVisible();
    await expect(page.getByTestId('login-btn')).toBeVisible();
    await expect(page.locator('.s25-frame')).toBeVisible();
  });

  test('login with valid credentials redirects to app', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('email').fill(TEST_EMAIL);
    await page.getByTestId('password').fill(TEST_PASSWORD);
    await page.getByTestId('login-btn').click();
    await page.waitForURL('**/app.html', { timeout: 10000 });
    await expect(page.getByTestId('map')).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('email').fill(TEST_EMAIL);
    await page.getByTestId('password').fill('wrong-password');
    await page.getByTestId('login-btn').click();
    await expect(page.getByTestId('status')).toContainText('Error');
  });
});
