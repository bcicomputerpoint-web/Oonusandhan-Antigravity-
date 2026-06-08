import { describe, it, expect, beforeEach, vi } from 'vitest';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import { courseRoutes } from '../src/routes/courses';
import authPlugin from '../src/plugins/auth';
import rbacPlugin from '../src/plugins/rbac';
import { prisma } from '@onusandhan/db';

// Mock DB client
vi.mock('@onusandhan/db', () => ({
  UserRole: {
    SCHOLAR: 'SCHOLAR',
    AUTHOR: 'AUTHOR',
    FACULTY: 'FACULTY',
    INSTITUTION_ADMIN: 'INSTITUTION_ADMIN',
    ADMIN: 'ADMIN',
    SUPER_ADMIN: 'SUPER_ADMIN',
  },
  prisma: {
    enrollment: {
      findUnique: vi.fn(),
    },
    lessonProgress: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    lesson: {
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

describe('Courses API Integration Tests', () => {
  let app: any;

  beforeEach(async () => {
    app = Fastify();
    await app.register(cookie, { secret: 'test-secret' });
    await app.register(jwt, {
      secret: 'test-secret',
      cookie: { cookieName: 'token', signed: false },
    });
    await app.register(authPlugin);
    await app.register(rbacPlugin);
    await app.register(courseRoutes, { prefix: '/courses' });

    vi.clearAllMocks();
  });

  it('should successfully toggle lesson completed progress', async () => {
    const token = app.jwt.sign({
      id: 'scholar-user-123',
      email: 'scholar@onusandhan.ai',
      role: 'SCHOLAR',
    });

    const mockLesson = {
      id: 'lesson-123',
      title: 'Testing R code',
      moduleId: 'module-123',
      module: {
        id: 'module-123',
        courseId: 'course-123',
      },
    };

    (prisma.lesson.findUnique as any).mockResolvedValue(mockLesson);
    (prisma.enrollment.findUnique as any).mockResolvedValue({
      id: 'enrollment-123',
      userId: 'scholar-user-123',
      courseId: 'course-123',
    });

    const mockUpsertProgress = {
      id: 'progress-123',
      completed: true,
      lessonId: 'lesson-123',
      userId: 'scholar-user-123',
    };
    (prisma.lessonProgress.upsert as any).mockResolvedValue(mockUpsertProgress);

    const res = await app.inject({
      method: 'POST',
      url: '/courses/lessons/lesson-123/progress',
      cookies: { token },
      payload: {
        completed: true,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.progress.completed).toBe(true);
    expect(prisma.lessonProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_lessonId: {
            userId: 'scholar-user-123',
            lessonId: 'lesson-123',
          },
        },
        update: expect.objectContaining({ completed: true }),
        create: expect.objectContaining({
          userId: 'scholar-user-123',
          lessonId: 'lesson-123',
          completed: true,
        }),
      })
    );
  });
});
