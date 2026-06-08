import { test, expect } from '@playwright/test';

const handleOptions = async (route: any) => {
  await route.fulfill({
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:3000',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
  });
};

const fulfill = async (route: any, body: any, status = 200, setCookie = false) => {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': 'http://localhost:3000',
    'Access-Control-Allow-Credentials': 'true',
  };
  if (setCookie) {
    headers['Set-Cookie'] = 'token=mock-valid-jwt-token; Path=/; Domain=localhost';
  }
  await route.fulfill({
    status,
    contentType: 'application/json',
    headers,
    body: JSON.stringify(body),
  });
};

test.describe('Authentication and i18n flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Log network requests/responses and browser console
    page.on('request', req => console.log(`[REQ] ${req.method()} ${req.url()}`));
    page.on('response', res => console.log(`[RES] ${res.status()} ${res.url()}`));
    page.on('console', msg => console.log(`[CONSOLE] ${msg.type()}: ${msg.text()}`));

    // Intercept initial profile session checks to avoid database dependencies
    await page.route(/http:\/\/localhost:3001\/auth\/me/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, { success: true, user: null });
    });
  });

  test('should register, log in, redirect to scholar dashboard, and toggle language', async ({ page }) => {
    // Intercept Registration request and mock setting the token cookie
    await page.route(/http:\/\/localhost:3001\/auth\/register/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, {
        success: true,
        user: { id: 'u1', email: 'test@onusandhan.ai', name: 'Tasnim Ahmed', role: 'SCHOLAR', preferredLanguage: 'en' },
      }, 200, true);
    });

    // Navigate to registration page
    await page.goto('/auth/register');
    await page.fill('input[type="text"] >> nth=0', 'Tasnim Ahmed');
    await page.fill('input[type="email"]', 'test@onusandhan.ai');
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[placeholder*="University"]', 'Dhaka University');

    // Intercept the subsequent auth/me check for active login session
    await page.route(/http:\/\/localhost:3001\/auth\/me/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, {
        success: true,
        user: { id: 'u1', email: 'test@onusandhan.ai', name: 'Tasnim Ahmed', role: 'SCHOLAR', preferredLanguage: 'en' },
      });
    });

    // Mock initial dashboard endpoints so page doesn't crash loading documents/courses
    await page.route(/http:\/\/localhost:3001\/papers/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, { success: true, papers: [] });
    });
    await page.route(/http:\/\/localhost:3001\/courses\/enrolled/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, { success: true, enrollments: [] });
    });
    await page.route(/http:\/\/localhost:3001\/services\/wings/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, { success: true, wings: [] });
    });
    await page.route(/http:\/\/localhost:3001\/services\/requests/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, { success: true, requests: [] });
    });
    await page.route(/http:\/\/localhost:3001\/tickets/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, { success: true, tickets: [] });
    });
    await page.route(/http:\/\/localhost:3001\/payments\/history/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, { success: true, payments: [] });
    });

    // Submit register form
    await page.click('button[type="submit"]');

    // Expect redirect to scholar dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h4', { hasText: 'Tasnim Ahmed' })).toBeVisible();

    // Track PUT preferred language requests
    let langUpdated = false;
    await page.route(/http:\/\/localhost:3001\/auth\/preferred-language/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      const payload = JSON.parse(route.request().postData() || '{}');
      if (payload.preferredLanguage === 'bn') {
        langUpdated = true;
      }
      await fulfill(route, { success: true, user: { id: 'u1', preferredLanguage: 'bn' } });
    });

    // Click the language toggle button to switch to Bangla
    await page.click('button:has-text("বাংলা")');

    // Verify language change is synced to the API
    expect(langUpdated).toBe(true);
  });
});
