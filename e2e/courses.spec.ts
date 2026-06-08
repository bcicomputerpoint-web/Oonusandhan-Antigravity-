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

test.describe('Courses and Progress E2E Flow', () => {
  const mockScholarUser = {
    id: 'scholar-1',
    email: 'scholar@onusandhan.ai',
    name: 'Tasnim Scholar',
    role: 'SCHOLAR',
    preferredLanguage: 'en',
  };

  const mockCourseObj = {
    id: 'course-101',
    title: 'Scientific Research Methodology',
    description: 'Learn the fundamentals of scholarly investigation and research design.',
    price: 0,
    isEnrolled: false,
    modulesCount: 1,
    modules: [
      {
        id: 'mod-1',
        title: 'Introduction to Research Design',
        orderIndex: 1,
        description: 'Core concepts of academic inquiry.',
        lessons: [
          {
            id: 'lesson-201',
            title: 'Formulating Hypotheses',
            completed: false,
            content: 'Detailed lesson synopsis and methodology formulations...',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          },
        ],
      },
    ],
  };

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
    // Authenticate user session automatically
    await page.route(/http:\/\/localhost:3001\/auth\/me/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, { success: true, user: mockScholarUser });
    });

    // Mock other dashboard endpoints to prevent page crashes when navigating to dashboard
    await page.route(/http:\/\/localhost:3001\/papers/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, { success: true, papers: [] });
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

  test('should enroll in course, toggle lesson study progress, and check progress reflection in dashboard Continue Learning widget', async ({ page }) => {
    // 1. Mock course list catalog endpoint
    await page.route(/http:\/\/localhost:3001\/courses$/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, { success: true, courses: [mockCourseObj] });
    });

    let enrollCalled = false;

    // Mock individual course details fetch (dynamic based on enrollCalled state)
    await page.route(/http:\/\/localhost:3001\/courses\/course-101$/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, {
        success: true,
        course: enrollCalled ? { ...mockCourseObj, isEnrolled: true } : mockCourseObj,
      });
    });

    // Navigate to courses catalog
    await page.goto('/courses');

    // Verify course is visible
    await expect(page.locator('h3', { hasText: 'Scientific Research Methodology' })).toBeVisible();

    // Click "Explore Syllabus"
    await page.click('a:has-text("Explore Syllabus")');
    await expect(page).toHaveURL(/.*courses\/course-101/);

    // 2. Perform Enrollment action
    await page.route(/http:\/\/localhost:3001\/courses\/course-101\/enroll/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      if (route.request().method() === 'POST') {
        enrollCalled = true;
        await fulfill(route, { success: true });
      }
    });

    // Click "Enroll Now"
    await page.click('button:has-text("Enroll Now")');

    // Verify enrollment call made
    await expect.poll(() => enrollCalled).toBe(true);

    // Verify button text updates or shows "Start Studying"
    await expect(page.locator('a:has-text("Start Studying")')).toBeVisible();

    // 3. Navigate to lesson workspace
    await page.click('a:has-text("Start Studying")');
    await expect(page).toHaveURL(/.*courses\/course-101\/lessons\/lesson-201/);

    // Verify initial workspace loaded
    await expect(page.locator('h1', { hasText: 'Formulating Hypotheses' })).toBeVisible();
    await expect(page.locator('aside >> text=Course Progress')).toBeVisible();
    await expect(page.locator('aside >> text=0%')).toBeVisible();

    // 4. Toggle lesson complete progress checkbox
    let progressToggled = false;
    await page.route(/http:\/\/localhost:3001\/courses\/lessons\/lesson-201\/progress/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      if (route.request().method() === 'POST') {
        const payload = JSON.parse(route.request().postData() || '{}');
        expect(payload.completed).toBe(true);
        progressToggled = true;
        await fulfill(route, { success: true });
      }
    });

    // Mock updated course workspace data showing the completed lesson
    const completedCourseObj = {
      ...mockCourseObj,
      isEnrolled: true,
      modules: [
        {
          ...mockCourseObj.modules[0],
          lessons: [
            {
              ...mockCourseObj.modules[0].lessons[0],
              completed: true,
            },
          ],
        },
      ],
    };
    await page.route(/http:\/\/localhost:3001\/courses\/course-101$/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, { success: true, course: completedCourseObj });
    });

    // Click "Mark as Complete"
    await page.click('button:has-text("Mark as Complete")');

    // Assert endpoint was called
    await expect.poll(() => progressToggled).toBe(true);

    // Verify progress visual percentage shows 100%
    await expect(page.locator('aside >> text=100%')).toBeVisible();
    await expect(page.locator('button:has-text("Lesson Completed ✓")')).toBeVisible();

    // 5. Verify reflection in Scholar Dashboard Continue Learning widgets
    await page.route(/http:\/\/localhost:3001\/courses\/enrolled/, async (route) => {
      if (route.request().method() === 'OPTIONS') return handleOptions(route);
      await fulfill(route, {
        success: true,
        enrollments: [
          {
            courseId: 'course-101',
            title: 'Scientific Research Methodology',
            progressPercent: 100,
          },
        ],
      });
    });

    // Navigate to scholar dashboard
    await page.goto('/dashboard');

    // Confirm that the Continue Learning / My Courses list displays course with progress 100%
    await expect(page.locator('text=My Courses')).toBeVisible();
    const courseProgressRow = page.locator('a:has-text("Scientific Research Methodology")');
    await expect(courseProgressRow).toBeVisible();
    await expect(courseProgressRow.locator('span:has-text("100%")')).toBeVisible();
  });
});
