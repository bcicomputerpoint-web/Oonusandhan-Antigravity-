import { describe, it, expect, beforeEach, vi } from 'vitest';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import { authRoutes } from '../src/routes/auth';
import authPlugin from '../src/plugins/auth';
import { prisma } from '@onusandhan/db';
import bcrypt from 'bcryptjs';

// Mock DB client
vi.mock('@onusandhan/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    institution: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

describe('Auth API Integration Tests', () => {
  let app: any;

  beforeEach(async () => {
    app = Fastify();
    
    // Register standard plugins
    await app.register(cookie, { secret: 'test-secret' });
    await app.register(jwt, {
      secret: 'test-secret',
      cookie: { cookieName: 'token', signed: false },
    });
    await app.register(authPlugin);
    await app.register(authRoutes, { prefix: '/auth' });
    
    vi.clearAllMocks();
  });

  it('should successfully register a new user', async () => {
    // Mock user search to return null (no existing user)
    (prisma.user.findUnique as any).mockResolvedValue(null);
    
    const mockCreatedUser = {
      id: 'mock-user-123',
      email: 'test@onusandhan.ai',
      name: 'Test Scholar',
      role: 'SCHOLAR',
      institutionId: null,
      plan: 'FREE',
      preferredLanguage: 'en',
    };
    (prisma.user.create as any).mockResolvedValue(mockCreatedUser);
    (prisma.auditLog.create as any).mockResolvedValue({});

    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'test@onusandhan.ai',
        password: 'password123',
        name: 'Test Scholar',
        role: 'SCHOLAR',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.user.id).toBe('mock-user-123');
    expect(prisma.user.create).toHaveBeenCalled();
    expect(res.headers['set-cookie']).toBeDefined(); // Cookie set
  });

  it('should successfully log in a valid user', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const mockUser = {
      id: 'mock-user-123',
      email: 'test@onusandhan.ai',
      name: 'Test Scholar',
      passwordHash: hashedPassword,
      role: 'SCHOLAR',
      institutionId: null,
      isLocked: false,
      plan: 'FREE',
      preferredLanguage: 'en',
    };

    (prisma.user.findUnique as any).mockResolvedValue(mockUser);
    (prisma.auditLog.create as any).mockResolvedValue({});

    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'test@onusandhan.ai',
        password: 'password123',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.user.email).toBe('test@onusandhan.ai');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should block logins for locked accounts', async () => {
    const mockLockedUser = {
      id: 'mock-user-locked',
      email: 'locked@onusandhan.ai',
      name: 'Locked User',
      passwordHash: 'somehash',
      role: 'SCHOLAR',
      isLocked: true,
    };

    (prisma.user.findUnique as any).mockResolvedValue(mockLockedUser);

    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'locked@onusandhan.ai',
        password: 'password123',
      },
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.message).toContain('locked');
  });

  it('should update language preference for authenticated users', async () => {
    // Generate valid test JWT token
    const token = app.jwt.sign({
      id: 'mock-user-123',
      email: 'test@onusandhan.ai',
      role: 'SCHOLAR',
    });

    const mockUpdatedUser = {
      id: 'mock-user-123',
      email: 'test@onusandhan.ai',
      name: 'Test Scholar',
      role: 'SCHOLAR',
      preferredLanguage: 'bn',
    };
    (prisma.user.update as any).mockResolvedValue(mockUpdatedUser);

    const res = await app.inject({
      method: 'PUT',
      url: '/auth/preferred-language',
      cookies: { token },
      payload: {
        preferredLanguage: 'bn',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.user.preferredLanguage).toBe('bn');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'mock-user-123' },
      data: { preferredLanguage: 'bn' },
      select: expect.any(Object),
    });
  });
});
