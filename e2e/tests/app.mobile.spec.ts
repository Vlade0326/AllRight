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

    await expect(page.getByTestId('proof-history')).toBeVisible();
    await expect(page.getByTestId('history-item')).toHaveCount(2, { timeout: 5000 });
  });

  test('check geofence returns secure inside zone', async ({ page }) => {
    await page.getByTestId('geofence-btn').click();
    await expect(page.getByTestId('app-status')).toContainText(/confirmada|SECURE/i, {
      timeout: 10000,
    });
  });

  test('panic button triggers and resolves SOS alert', async ({ page }) => {
    await expect(page.getByTestId('panic-btn')).toBeVisible();
    await page.getByTestId('panic-btn').click();
    await expect(page.getByTestId('panic-modal')).toBeVisible();
    await page.getByTestId('panic-confirm-btn').click();
    await expect(page.getByTestId('panic-active')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('app-status')).toContainText(/alerta enviada/i, {
      timeout: 5000,
    });
    await page.getByTestId('panic-resolve-btn').click();
    await expect(page.getByTestId('panic-btn')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('app-status')).toContainText(/cancelada/i);
  });

  test('BLE proximity simulator reports inside zone', async ({ page }) => {
    await expect(page.getByTestId('ble-proximity')).toBeVisible();
    await page.getByTestId('ble-simulate-btn').click();
    await expect(page.getByTestId('ble-status')).toContainText(/zona interior/i, {
      timeout: 10000,
    });
    await expect(page.getByTestId('app-status')).toContainText(/BLE: en zona/i);
    await expect(page.getByTestId('hybrid-status')).toContainText(/interior|Seguro/i, {
      timeout: 10000,
    });
  });
});
