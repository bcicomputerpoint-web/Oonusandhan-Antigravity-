import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { prisma } from '@onusandhan/db';
import { z } from 'zod';

const createTicketSchema = z.object({
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(5, 'Message must be at least 5 characters'),
});

export const ticketRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Gated by authentication preHandler hook
  fastify.addHook('preHandler', fastify.authenticate);

  // 1. POST / - Create a new support ticket
  fastify.post('/', async (request, reply) => {
    try {
      const parsed = createTicketSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          message: parsed.error.issues[0]?.message || 'Invalid ticket inputs',
        });
      }

      const { subject, message } = parsed.data;
      const currentUser = request.user as any;

      const ticket = await prisma.supportTicket.create({
        data: {
          userId: currentUser.id,
          subject,
          message,
          status: 'OPEN',
        },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'SUPPORT_TICKET_CREATED',
          details: `Created support ticket: ${subject} (Ticket ID: ${ticket.id})`,
          ipAddress: request.ip,
        },
      });

      return {
        success: true,
        message: 'Support ticket created successfully',
        ticket,
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error creating support ticket' });
    }
  });

  // 2. GET / - List scholar's own support tickets
  fastify.get('/', async (request, reply) => {
    try {
      const currentUser = request.user as any;

      const tickets = await prisma.supportTicket.findMany({
        where: { userId: currentUser.id },
        orderBy: { createdAt: 'desc' },
      });

      return { success: true, tickets };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error retrieving support tickets' });
    }
  });
};
