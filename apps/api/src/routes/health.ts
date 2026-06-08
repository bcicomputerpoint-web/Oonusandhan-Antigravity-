import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { prisma } from '@onusandhan/db';

export const healthRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/', async (_request, reply) => {
    try {
      // Check database connection by running a simple query
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: 'Connected',
        services: {
          api: 'Healthy',
          database: 'Healthy',
        },
      };
    } catch (error: any) {
      return reply.status(500).send({
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        database: 'Disconnected',
        error: error.message || 'Database connection error',
      });
    }
  });
};
