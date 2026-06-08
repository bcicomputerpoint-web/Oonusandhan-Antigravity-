import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { UserRole } from '@onusandhan/db';

declare module 'fastify' {
  interface FastifyInstance {
    requireRoles: (allowedRoles: UserRole[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const rbacPlugin: FastifyPluginAsync = fp(async (fastify: FastifyInstance) => {
  fastify.decorate('requireRoles', (allowedRoles: UserRole[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as any;
      if (!user || !user.role) {
        return reply.status(401).send({ success: false, message: 'Unauthorized session' });
      }

      // Check if user role matches one of the allowed roles
      if (!allowedRoles.includes(user.role as UserRole)) {
        request.log.warn(`[RBAC] User ${user.email} with role ${user.role} attempted unauthorized access to route ${request.url}`);
        return reply.status(403).send({ 
          success: false, 
          message: 'Access denied: insufficient privileges' 
        });
      }
    };
  });
});

export default rbacPlugin;
