import { test, expect } from '@playwright/test';

const TEST_EMAIL = `app-${Date.now()}@allright.test`;
const TEST_PASSWORD = 'TestPass123!';

test.describe('Post-login App — mobile', () => {
  test.beforeAll(async ({ request }) => {
    await request.post('/users', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
  });

  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 3.4516, longitude: -76.532 });
    await page.goto('/');
    await page.getByTestId('email').fill(TEST_EMAIL);
    await page.getByTestId('password').fill(TEST_PASSWORD);
    await page.getByTestId('login-btn').click();
    await page.waitForURL('**/app.html');
  });

  test('shows map and location panel after login', async ({ page }) => {
    await expect(page.getByTestId('map')).toBeVisible();
    await expect(page.getByTestId('coords-panel')).toBeVisible();
    await expect(page.getByTestId('prove-btn')).toBeVisible();
    await expect(page.getByTestId('verify-btn')).toBeVisible();
  });

  test('generates and verifies location proof', async ({ page }) => {
    await page.getByTestId('prove-btn').click();
    await expect(page.getByTestId('app-status')).toContainText(/proof/i, {
      timeout: 15000,
    });

    await page.getByTestId('verify-btn').click();
    await expect(page.getByTestId('app-status')).toContainText(/verificado/i, {
      timeout: 15000,
    });
  });

  test('check geofence returns secure inside zone', async ({ page }) => {
    await page.getByTestId('geofence-btn').click();
    await expect(page.getByTestId('app-status')).toContainText(/confirmada|SECURE/i, {
      timeout: 10000,
    });
  });
});
