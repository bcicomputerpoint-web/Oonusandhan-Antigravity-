import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { prisma } from '@onusandhan/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum([
    'SCHOLAR',
    'AUTHOR',
    'FACULTY',
    'INSTITUTION_ADMIN',
    'ADMIN',
    'SUPER_ADMIN',
  ] as const),
  institutionName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Register route
  fastify.post('/register', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute'
      }
    }
  }, async (request, reply) => {
    try {
      const parsed = registerSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid input fields',
          errors: parsed.error.flatten(),
        });
      }

      const { email, password, name, role, institutionName } = parsed.data;

      // Prevent registering administrative roles directly via public registration
      const restrictedRoles = ['ADMIN', 'SUPER_ADMIN', 'INSTITUTION_ADMIN'];
      if (restrictedRoles.includes(role)) {
        return reply.status(400).send({
          success: false,
          message: 'Cannot register with administrative roles directly. Please contact an administrator.',
        });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return reply.status(400).send({
          success: false,
          message: 'Email address already registered',
        });
      }

      let institutionId = null;
      if (institutionName) {
        // Find or create institution
        let inst = await prisma.institution.findUnique({
          where: { name: institutionName },
        });
        if (!inst) {
          inst = await prisma.institution.create({
            data: {
              name: institutionName,
              type: 'University',
              location: 'Unknown',
              verified: false,
            },
          });
        }
        institutionId = inst.id;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          role,
          institutionId,
        },
      });

      // Log the registration
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_REGISTERED',
          details: `Registered with email: ${email}, role: ${role}`,
          ipAddress: request.ip,
        },
      });

      // Generate JWT token
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        institutionId: user.institutionId,
        plan: user.plan,
        preferredLanguage: user.preferredLanguage,
      });

      reply.setCookie('token', token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return {
        success: true,
        message: 'Account registered successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          institutionId: user.institutionId,
          plan: user.plan,
          preferredLanguage: user.preferredLanguage,
        },
        token,
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error' });
    }
  });

  // Login route
  fastify.post('/login', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute'
      }
    }
  }, async (request, reply) => {
    try {
      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid input fields',
          errors: parsed.error.flatten(),
        });
      }

      const { email, password } = parsed.data;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return reply.status(401).send({
          success: false,
          message: 'Invalid email or password credentials',
        });
      }

      if (user.isLocked) {
        return reply.status(403).send({
          success: false,
          message: 'Account is locked. Please contact support.',
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return reply.status(401).send({
          success: false,
          message: 'Invalid email or password credentials',
        });
      }

      // Log login
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_LOGIN',
          details: `Successfully logged in.`,
          ipAddress: request.ip,
        },
      });

      // Generate token
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        institutionId: user.institutionId,
        plan: user.plan,
        preferredLanguage: user.preferredLanguage,
      });

      reply.setCookie('token', token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return {
        success: true,
        message: 'Logged in successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          institutionId: user.institutionId,
          plan: user.plan,
          preferredLanguage: user.preferredLanguage,
        },
        token,
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error' });
    }
  });

  // Logout route
  fastify.post('/logout', async (_request, reply) => {
    reply.clearCookie('token', { path: '/' });
    return { success: true, message: 'Logged out successfully' };
  });

  // Me (current session profile check)
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const jwtUser = request.user as any;
      const user = await prisma.user.findUnique({
        where: { id: jwtUser.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          institutionId: true,
          isLocked: true,
          plan: true,
          preferredLanguage: true,
          createdAt: true,
        },
      });

      if (!user) {
        return reply.status(404).send({ success: false, message: 'User not found' });
      }

      if (user.isLocked) {
        return reply.status(403).send({ success: false, message: 'Account is locked' });
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          institutionId: user.institutionId,
          plan: user.plan,
          preferredLanguage: user.preferredLanguage,
          createdAt: user.createdAt,
        },
      };
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: 'Server error' });
    }
  });

  // Mock Google OAuth callback route (integration ready)
  fastify.get('/google', async (_request, reply) => {
    return reply.send({
      success: true,
      message: 'Google login integration ready. Redirect to Google OAuth URL on frontend first.',
      oauthUrl: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=MOCK_CLIENT_ID&redirect_uri=http://localhost:3001/auth/google&response_type=code&scope=email%20profile'
    });
  });

  // Gated route to save language preference (English/Bangla)
  fastify.put('/preferred-language', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const jwtUser = request.user as any;
      const { preferredLanguage } = z.object({ preferredLanguage: z.enum(['en', 'bn']) }).parse(request.body);

      const user = await prisma.user.update({
        where: { id: jwtUser.id },
        data: { preferredLanguage },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          institutionId: true,
          plan: true,
          preferredLanguage: true,
        }
      });

      // Sign a new token reflecting updated language
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        institutionId: user.institutionId,
        plan: user.plan,
        preferredLanguage: user.preferredLanguage,
      });

      reply.setCookie('token', token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return {
        success: true,
        message: 'Language preference saved successfully',
        user,
        token,
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(550).send({ success: false, message: 'Server error updating language preference' });
    }
  });
};
