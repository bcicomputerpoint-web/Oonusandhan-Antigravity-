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

const fulfill = async (route: any, body: any, status = 200) => {
  await route.fulfill({
    status,
    contentType: 'application/json',
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:3000',
      'Access-Control-Allow-Credentials': 'true',
    },
    body: JSON.stringify(body),
  });
};

test.describe('Document Management E2E Flow', () => {
  const mockUser = {
    id: 'scholar-u1',
    email: 'scholar@onusandhan.ai',
    name: 'Dr. Tasnim',
    role: 'SCHOLAR',
    preferredLanguage: 'en',
  };

  const mockPapers = [
    {
      id: 'paper-123',
      title: 'A Review on Transformer Models in Low Resource Languages',
      abstract: 'Abstract testing details...',
      keywords: ['nlp', 'transformers'],
      status: 'SUBMITTED',
      category: 'PUBLICATION',
      createdAt: new Date().toISOString(),
      fileSize: 45678,
      mimeType: 'application/pdf',
      doi: '10.1234/onusandhan.123',
      citations: 2,
    }
  ];

  test.beforeEach(async ({ page, context }) => {
    // Log network requests/responses
    page.on('request', req => console.log(`[REQ] ${req.method()} ${req.url()}`));
    page.on('response', res => console.log(`[RES] ${res.status()} ${res.url()}`));

    // Set cookie session context
    await context.addCookies([
      {
        name: 'token',
        value: 'mock-valid-jwt-token',
        url: 'http://localhost:3000',
      },
    ]);

    // Intercept profile checks to sign in automatically
    await page.route(/http:\/\/localhost:3001\/auth\/me/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, { success: true, user: mockUser });
    });

    // Mock initial dashboard listings
    await page.route(/http:\/\/localhost:3001\/papers$/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      if (route.request().method() === 'GET') {
        await fulfill(route, { success: true, papers: mockPapers });
      } else {
        await route.continue();
      }
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
  });

  test('should display document catalog, perform uploads, open preview drawer, and perform secure deletes', async ({ page }) => {
    // Mock successful document upload
    let uploadExecuted = false;
    await page.route(/http:\/\/localhost:3001\/papers$/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      if (route.request().method() === 'POST') {
        uploadExecuted = true;
        await fulfill(route, {
          success: true,
          paper: {
            id: 'paper-456',
            title: 'Upload Test Paper',
            abstract: 'Uploaded abstract text',
            keywords: ['test'],
            status: 'SUBMITTED',
          },
        });
      } else {
        // Reload listing after upload
        await fulfill(route, {
          success: true,
          papers: [
            ...mockPapers,
            {
              id: 'paper-456',
              title: 'Upload Test Paper',
              abstract: 'Uploaded abstract text',
              keywords: ['test'],
              status: 'SUBMITTED',
              category: 'THESIS',
              createdAt: new Date().toISOString(),
            }
          ],
        });
      }
    });

    await page.goto('/dashboard');

    // Populate Upload Form fields
    await page.fill('form input[type="text"]', 'Upload Test Paper');
    await page.fill('form textarea', 'Uploaded abstract text description...');
    await page.selectOption('select', 'THESIS');

    // Upload a mock file (PDF)
    await page.setInputFiles('input[type="file"]', {
      name: 'manuscript.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('mock pdf content'),
    });

    // Submit upload form
    await page.click('button:has-text("Upload Manuscript")');

    // Verify upload executed
    expect(uploadExecuted).toBe(true);

    // Click on Documents Desk tab
    await page.click('button:has-text("Documents Desk")');

    // Verify both items show in dashboard catalog
    await expect(page.locator('h3', { hasText: 'Transformer Models' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Upload Test Paper' })).toBeVisible();

    // Click on a paper to open details split view preview pane
    await page.click('div:has(h3:has-text("Transformer Models")) button:has-text("Preview")');

    // Expect preview drawer details to load
    await expect(page.locator('text=Mime Type')).toBeVisible();
    await expect(page.locator('text=application/pdf')).toBeVisible();

    // Test Deletion flow
    let deleteExecuted = false;
    await page.route(/http:\/\/localhost:3001\/papers\/paper-123/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      if (route.request().method() === 'DELETE') {
        deleteExecuted = true;
        await fulfill(route, { success: true });
      }
    });

    // Mock list update after deletion
    await page.route(/http:\/\/localhost:3001\/papers$/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, {
        success: true,
        papers: [{ id: 'paper-456', title: 'Upload Test Paper', status: 'SUBMITTED', keywords: ['test'] }],
      });
    });

    // Register dialog accept handler
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('delete this document');
      await dialog.accept();
    });

    // Click delete button inside details pane
    await page.click('button.bg-red-50');

    // Verify backend call was successfully made and list is refreshed
    expect(deleteExecuted).toBe(true);
    await expect(page.locator('h3', { hasText: 'Transformer Models' })).not.toBeVisible();
  });
});
