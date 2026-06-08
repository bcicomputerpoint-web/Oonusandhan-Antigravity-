import { describe, it, expect, beforeEach, vi } from 'vitest';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import { adminRoutes } from '../src/routes/admin';
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
    user: {
      count: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    document: {
      count: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
    review: {
      count: vi.fn(),
    },
    serviceRequest: {
      count: vi.fn(),
    },
    enrollment: {
      count: vi.fn(),
    },
    auditLog: {
      count: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    supportTicket: {
      findMany: vi.fn(),
    },
  },
}));

describe('Admin API Integration Tests', () => {
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
    await app.register(adminRoutes, { prefix: '/admin' });
    
    vi.clearAllMocks();
  });

  it('should block non-admin users from accessing dashboard stats', async () => {
    // Generate SCHOLAR token
    const token = app.jwt.sign({
      id: 'scholar-user',
      email: 'scholar@onusandhan.ai',
      role: 'SCHOLAR',
    });

    const res = await app.inject({
      method: 'GET',
      url: '/admin/dashboard-stats',
      cookies: { token },
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.message).toContain('Access denied');
  });

  it('should allow platform admin to view dashboard stats', async () => {
    const token = app.jwt.sign({
      id: 'admin-user',
      email: 'admin@onusandhan.ai',
      role: 'ADMIN',
    });

    (prisma.user.count as any).mockResolvedValue(10);
    (prisma.document.count as any).mockResolvedValue(5);
    (prisma.review.count as any).mockResolvedValue(3);
    (prisma.serviceRequest.count as any).mockResolvedValue(2);
    (prisma.enrollment.count as any).mockResolvedValue(4);
    (prisma.auditLog.count as any).mockResolvedValue(50);
    (prisma.document.findMany as any).mockResolvedValue([]);
    (prisma.supportTicket.findMany as any).mockResolvedValue([]);
    (prisma.auditLog.findMany as any).mockResolvedValue([]);

    const res = await app.inject({
      method: 'GET',
      url: '/admin/dashboard-stats',
      cookies: { token },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.stats.totalUsers).toBe(10);
  });

  it('should toggle user lock state and record audit logs', async () => {
    const token = app.jwt.sign({
      id: 'super-admin-user',
      email: 'superadmin@onusandhan.ai',
      role: 'SUPER_ADMIN',
    });

    const targetUser = {
      id: 'target-user-123',
      email: 'locked@onusandhan.ai',
      name: 'Locked User',
      isLocked: false,
      role: 'SCHOLAR',
    };

    const lockedUser = { ...targetUser, isLocked: true };

    (prisma.user.findUnique as any).mockResolvedValue(targetUser);
    (prisma.user.update as any).mockResolvedValue(lockedUser);
    (prisma.auditLog.create as any).mockResolvedValue({});

    const res = await app.inject({
      method: 'PUT',
      url: '/admin/users/target-user-123/lock',
      cookies: { token },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.user.isLocked).toBe(true);
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'USER_LOCKED',
        details: expect.stringContaining('locked@onusandhan.ai'),
      }),
    });
  });
});
