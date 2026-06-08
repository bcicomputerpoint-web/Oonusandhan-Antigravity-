import { env } from './config/env';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { prisma } from '@onusandhan/db';
import { healthRoutes } from './routes/health';
import { authRoutes } from './routes/auth';
import { paperRoutes } from './routes/papers';
import { reviewRoutes } from './routes/reviews';
import { adminRoutes } from './routes/admin';
import { aiRoutes } from './routes/ai';
import { serviceRoutes } from './routes/services';
import { courseRoutes } from './routes/courses';
import { ticketRoutes } from './routes/tickets';
import { paymentRoutes } from './routes/payments';
import authPlugin from './plugins/auth';
import rbacPlugin from './plugins/rbac';

const server = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

// Setup Zod Validation compilers
server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

// Configure Global Error Handler to mask internal errors
server.setErrorHandler((error, request, reply) => {
  request.log.error(error);

  if (error.validation) {
    return reply.status(400).send({
      success: false,
      message: 'Validation failed',
      errors: error.validation,
    });
  }

  // Handle rate-limiting errors specifically
  if (error.statusCode === 429) {
    return reply.status(429).send({
      success: false,
      message: error.message || 'Too many requests. Please try again later.',
    });
  }

  if (error.statusCode) {
    return reply.status(error.statusCode).send({
      success: false,
      message: error.message,
    });
  }

  // Shield stack trace and raw DB errors in production / client responses
  return reply.status(500).send({
    success: false,
    message: 'An internal server error occurred',
  });
});

async function bootstrap() {
  // Register Helmet secure headers
  await server.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", env.FRONTEND_URL],
      },
    } : false, // disable complex CSP in development to ease local test checks
  });

  // Register Hardened CORS
  await server.register(cors, {
    origin: (origin, cb) => {
      if (!origin) {
        cb(null, true);
        return;
      }
      const allowedOrigins = [env.FRONTEND_URL, 'http://localhost:3000'];
      if (allowedOrigins.includes(origin)) {
        cb(null, true);
        return;
      }
      cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Register Global Rate Limiting
  await server.register(rateLimit, {
    max: 150, // default limit
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      success: false,
      message: 'Rate limit exceeded. Please wait a moment.',
    }),
  });

  // Register Cookies
  await server.register(cookie, {
    secret: env.JWT_SECRET,
    hook: 'onRequest',
  });

  // Register JWT
  await server.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: 'token',
      signed: false,
    },
  });

  // Register plugins
  await server.register(authPlugin);
  await server.register(rbacPlugin);

  // Register Multipart for secure file uploads
  await server.register(multipart, {
    limits: {
      fieldNameSize: 100,
      fieldSize: 100,
      fields: 10,
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 1,
    },
  });

  // Register routes
  await server.register(healthRoutes, { prefix: '/health' });
  await server.register(authRoutes, { prefix: '/auth' });
  await server.register(paperRoutes, { prefix: '/papers' });
  await server.register(reviewRoutes, { prefix: '/reviews' });
  await server.register(adminRoutes, { prefix: '/admin' });
  await server.register(aiRoutes, { prefix: '/ai' });
  await server.register(serviceRoutes, { prefix: '/services' });
  await server.register(courseRoutes, { prefix: '/courses' });
  await server.register(ticketRoutes, { prefix: '/tickets' });
  await server.register(paymentRoutes, { prefix: '/payments' });

  const port = env.PORT;
  const host = '0.0.0.0';

  try {
    await server.listen({ port, host });
    server.log.info(`🚀 Onusandhan AI Backend running on http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

const shutdown = async () => {
  await prisma.$disconnect();
  server.log.info('Database disconnected. Shutting down server.');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

bootstrap();
