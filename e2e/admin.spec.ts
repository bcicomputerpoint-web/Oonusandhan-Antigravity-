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

test.describe('Admin Dashboard and Operations E2E', () => {
  const mockScholarUser = {
    id: 'scholar-1',
    email: 'scholar@onusandhan.ai',
    name: 'Tasnim Scholar',
    role: 'SCHOLAR',
    preferredLanguage: 'en',
  };

  const mockAdminUser = {
    id: 'admin-1',
    email: 'admin@onusandhan.ai',
    name: 'Admin User',
    role: 'SUPER_ADMIN',
    preferredLanguage: 'en',
  };

  const mockUsersList = [
    {
      id: 'scholar-1',
      name: 'Tasnim Scholar',
      email: 'scholar@onusandhan.ai',
      role: 'SCHOLAR',
      isLocked: false,
      institution: { name: 'Dhaka University' },
    },
    {
      id: 'user-to-lock',
      name: 'Spammer User',
      email: 'spammer@onusandhan.ai',
      role: 'SCHOLAR',
      isLocked: false,
      institution: null,
    },
  ];

  const mockAuditLogs = [
    {
      id: 'log-1',
      createdAt: new Date().toISOString(),
      action: 'USER_LOGIN',
      details: 'Admin logged in from localhost',
      ipAddress: '127.0.0.1',
      user: { name: 'Admin User', email: 'admin@onusandhan.ai' },
    },
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
  });

  test('should redirect standard scholar away from admin dashboard to dashboard', async ({ page }) => {
    // Mock user session as Scholar
    await page.route(/http:\/\/localhost:3001\/auth\/me/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, { success: true, user: mockScholarUser });
    });

    // Mock other dashboard endpoints to prevent page crashes during redirect
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

    // Navigate to admin route
    await page.goto('/dashboard/admin');

    // Expect redirect to regular dashboard
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('should allow access to admin user, load stats, toggle user lock state with confirmation modal, and verify audit logs', async ({ page }) => {
    // 1. Mock user session as Admin
    await page.route(/http:\/\/localhost:3001\/auth\/me/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, { success: true, user: mockAdminUser });
    });

    // 2. Mock Admin dashboard data APIs
    await page.route(/http:\/\/localhost:3001\/admin\/dashboard-stats/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, {
        success: true,
        stats: {
          totalUsers: 2,
          totalPapers: 5,
          totalReviews: 2,
          pendingReviews: 1,
          activeServiceRequests: 3,
          totalEnrollments: 4,
          totalTokens: 15000,
          totalAiCalls: 35,
          recentUploads: [],
          recentSupportTickets: [],
        },
      });
    });

    await page.route(/http:\/\/localhost:3001\/papers/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, { success: true, papers: [] });
    });

    await page.route(/http:\/\/localhost:3001\/admin\/users$/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, { success: true, users: mockUsersList });
    });

    await page.route(/http:\/\/localhost:3001\/admin\/audit-logs/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, { success: true, logs: mockAuditLogs });
    });

    await page.route(/http:\/\/localhost:3001\/ai\/usage/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, { success: true, stats: { totalCalls: 35, totalTokens: 15000, toolBreakdown: {} } });
    });

    await page.route(/http:\/\/localhost:3001\/services\/requests/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, { success: true, requests: [] });
    });

    await page.route(/http:\/\/localhost:3001\/courses$/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, { success: true, courses: [] });
    });

    await page.route(/http:\/\/localhost:3001\/admin\/support-tickets/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, { success: true, tickets: [] });
    });

    await page.route(/http:\/\/localhost:3001\/payments\/admin\/overview/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, {
        success: true,
        payments: [],
        stats: { totalRevenue: 150, successRate: 100, activeSubscribersCount: 2, totalTransactions: 10 },
      });
    });

    // Navigate to admin route
    await page.goto('/dashboard/admin');
    await expect(page).toHaveURL(/.*dashboard\/admin/);

    // Verify stats cards loaded
    await expect(page.locator('text=System Users')).toBeVisible();
    await expect(page.locator('text=15,000 tokens')).toBeVisible(); // AI Tokens Used locale string

    // 3. Switch to Users management tab
    await page.click('button:has-text("users")');

    // Verify user is visible in list
    await expect(page.locator('td', { hasText: 'Spammer User' })).toBeVisible();

    // Lock User action tracking
    let userLockCalled = false;
    await page.route(/http:\/\/localhost:3001\/admin\/users\/user-to-lock\/lock/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      if (route.request().method() === 'PUT') {
        userLockCalled = true;
        await fulfill(route, { success: true });
      }
    });

    // Mock refreshed users list after locking
    await page.route(/http:\/\/localhost:3001\/admin\/users$/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, {
        success: true,
        users: [
          mockUsersList[0],
          { ...mockUsersList[1], isLocked: true },
        ],
      });
    });

    // Mock audit logs list after locking
    await page.route(/http:\/\/localhost:3001\/admin\/audit-logs/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, {
        success: true,
        logs: [
          {
            id: 'log-2',
            createdAt: new Date().toISOString(),
            action: 'LOCK_USER',
            details: 'Locked user spammer@onusandhan.ai',
            ipAddress: '127.0.0.1',
            user: { name: 'Admin User', email: 'admin@onusandhan.ai' },
          },
          ...mockAuditLogs,
        ],
      });
    });

    // Click on Lock button for Spammer User. Spammer User is second row.
    const lockButton = page.locator('tr:has-text("Spammer User") button[title="Lock Account"]');
    await lockButton.click();

    // Verify dangerous action confirmation modal shows
    await expect(page.locator('text=Lock User Account?')).toBeVisible();
    await expect(page.locator('text=Are you sure you want to lock access for Spammer User')).toBeVisible();

    // Confirm locking
    await page.click('button:has-text("Confirm Lock")');

    // Assert API call was made
    expect(userLockCalled).toBe(true);

    // Verify UI updates: Spammer User lock icon changes to unlock
    await expect(page.locator('tr:has-text("Spammer User") button[title="Unlock Account"]')).toBeVisible();

    // 4. Switch to Audit Logs tab
    await page.click('button:has-text("logs")');

    // Verify LOCK_USER action appears in audit trail list
    await expect(page.locator('span:has-text("LOCK_USER")')).toBeVisible();
    await expect(page.locator('td:has-text("Locked user spammer@onusandhan.ai")')).toBeVisible();
  });
});
