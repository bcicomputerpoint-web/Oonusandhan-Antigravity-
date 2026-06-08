import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { prisma, RequestStatus, UserRole } from '@onusandhan/db';
import { z } from 'zod';

const createRequestSchema = z.object({
  wingId: z.string().uuid('Invalid Service Wing ID'),
  details: z.string().min(5, 'Please provide more detail about your support request'),
});

const updateStatusSchema = z.object({
  status: z.enum([
    'NEW',
    'IN_REVIEW',
    'ASSIGNED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
  ] as const),
});

export const serviceRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Public Endpoint: Retrieve all service wings
  fastify.get('/wings', async (request, reply) => {
    try {
      const wings = await prisma.serviceWing.findMany({
        orderBy: { name: 'asc' },
      });
      return { success: true, wings };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error retrieving service wings' });
    }
  });

  // Public Endpoint: Retrieve a specific service wing
  fastify.get('/wings/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const wing = await prisma.serviceWing.findUnique({
        where: { id },
      });

      if (!wing) {
        return reply.status(404).send({ success: false, message: 'Service wing not found' });
      }

      return { success: true, wing };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error retrieving service wing details' });
    }
  });

  // Authed Endpoint: Submit request (requires JWT authentication prehandler)
  fastify.post('/requests', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const parsed = createRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          message: parsed.error.issues[0]?.message || 'Invalid input parameters',
        });
      }

      const { wingId, details } = parsed.data;
      const currentUser = request.user as any;

      const wing = await prisma.serviceWing.findUnique({ where: { id: wingId } });
      if (!wing) {
        return reply.status(404).send({ success: false, message: 'Service wing not found' });
      }

      const serviceRequest = await prisma.serviceRequest.create({
        data: {
          userId: currentUser.id,
          wingId,
          details,
          status: RequestStatus.NEW,
        },
      });

      // Audit Log entry
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'SERVICE_REQUEST_CREATED',
          details: `Submitted request for wing: ${wing.name} (Request ID: ${serviceRequest.id})`,
          ipAddress: request.ip,
        },
      });

      return {
        success: true,
        message: 'Service request submitted successfully',
        request: serviceRequest,
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error submitting request' });
    }
  });

  // Authed Endpoint: Retrieve service requests list (Scholars see own, Admins see all)
  fastify.get('/requests', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const currentUser = request.user as any;
      const role = currentUser.role as UserRole;

      let requests;

      if (role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN) {
        requests = await prisma.serviceRequest.findMany({
          include: {
            user: { select: { name: true, email: true } },
            wing: true,
          },
          orderBy: { createdAt: 'desc' },
        });
      } else {
        requests = await prisma.serviceRequest.findMany({
          where: { userId: currentUser.id },
          include: {
            wing: true,
          },
          orderBy: { createdAt: 'desc' },
        });
      }

      return {
        success: true,
        requests,
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error retrieving requests' });
    }
  });

  // Authed Endpoint: Update service request status (Admins only)
  fastify.put('/requests/:id/status', { preHandler: [fastify.authenticate, fastify.requireRoles([UserRole.SUPER_ADMIN, UserRole.ADMIN])] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const currentUser = request.user as any;

      const parsed = updateStatusSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          message: parsed.error.issues[0]?.message || 'Invalid status value',
        });
      }

      const { status } = parsed.data;

      const serviceRequest = await prisma.serviceRequest.findUnique({
        where: { id },
        include: { wing: true },
      });

      if (!serviceRequest) {
        return reply.status(404).send({ success: false, message: 'Service request not found' });
      }

      const updated = await prisma.serviceRequest.update({
        where: { id },
        data: { status: status as RequestStatus },
      });

      // Audit Log entry
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'SERVICE_REQUEST_STATUS_UPDATED',
          details: `Updated request ID ${id} status from ${serviceRequest.status} to ${status}`,
          ipAddress: request.ip,
        },
      });

      return {
        success: true,
        message: 'Service request status updated successfully',
        request: updated,
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error updating request status' });
    }
  });
};
