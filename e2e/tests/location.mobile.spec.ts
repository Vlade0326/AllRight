import { test, expect } from '@playwright/test';

test.describe('Location & ZKP API — mobile client', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    const email = `loc-${Date.now()}@allright.test`;
    const password = 'TestPass123!';
    await request.post('/users', { data: { email, password } });
    const login = await request.post('/auth/login', {
      data: { email, password },
    });
    const body = await login.json();
    token = body.access_token;
  });

  test('generate and verify location proof inside zone', async ({ request }) => {
    const prove = await request.post('/location/prove', {
      headers: { Authorization: `Bearer ${token}` },
      data: { lat: 3.4516, lon: -76.532 },
    });
    expect(prove.ok()).toBeTruthy();
    const proofData = await prove.json();

    const verify = await request.post('/location/verify', {
      headers: { Authorization: `Bearer ${token}` },
      data: { proof: proofData.proof, payload: proofData.payload },
    });
    expect(verify.ok()).toBeTruthy();
    const result = await verify.json();
    expect(result.valid).toBe(true);
    expect(result.isInside).toBe(true);
  });

  test('health endpoints respond', async ({ request }) => {
    const health = await request.get('/health');
    expect(health.ok()).toBeTruthy();
    const metrics = await request.get('/metrics');
    expect(metrics.ok()).toBeTruthy();
    const body = await metrics.text();
    expect(body).toContain('http_request_duration_seconds');
  });
});
