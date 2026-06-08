import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { prisma, UserRole } from '@onusandhan/db';
import { z } from 'zod';

const updateRoleSchema = z.object({
  role: z.enum([
    'SCHOLAR',
    'AUTHOR',
    'FACULTY',
    'INSTITUTION_ADMIN',
    'ADMIN',
    'SUPER_ADMIN',
  ] as const),
});

export const adminRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', fastify.authenticate);

  // Get users list (Platform / Super Admin only)
  fastify.get('/users', { preHandler: [fastify.requireRoles([UserRole.SUPER_ADMIN, UserRole.ADMIN])] }, async (request, reply) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isLocked: true,
          createdAt: true,
          institution: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return { success: true, users };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error' });
    }
  });

  // Change user role (Super Admin only)
  fastify.put('/users/:id/role', { preHandler: [fastify.requireRoles([UserRole.SUPER_ADMIN])] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const currentUser = request.user as any;

      const parsed = updateRoleSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, message: 'Invalid role' });
      }

      const { role } = parsed.data;

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return reply.status(404).send({ success: false, message: 'User not found' });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { role: role as UserRole },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'USER_ROLE_UPDATED',
          details: `Updated user ${user.email} role from ${user.role} to ${role}`,
          ipAddress: request.ip,
        },
      });

      return {
        success: true,
        message: 'User role updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
        },
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error' });
    }
  });

  // Get audit logs (Super Admin / Admin only)
  fastify.get('/audit-logs', { preHandler: [fastify.requireRoles([UserRole.SUPER_ADMIN, UserRole.ADMIN])] }, async (request, reply) => {
    try {
      const logs = await prisma.auditLog.findMany({
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100, // Limit to recent 100 logs
      });

      return { success: true, logs };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error' });
    }
  });

  // Get overall dashboard stats
  fastify.get('/dashboard-stats', { preHandler: [fastify.requireRoles([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INSTITUTION_ADMIN])] }, async (request, reply) => {
    try {
      const currentUser = request.user as any;
      const role = currentUser.role as UserRole;

      let totalUsers = 0;
      let totalPapers = 0;
      let totalReviews = 0;
      let pendingReviews = 0;

      if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
        totalUsers = await prisma.user.count();
        totalPapers = await prisma.document.count();
        totalReviews = await prisma.review.count();
        pendingReviews = await prisma.review.count({ where: { status: 'PENDING' } });
        
        const activeServiceRequests = await prisma.serviceRequest.count({
          where: {
            status: {
              in: ['NEW', 'IN_REVIEW', 'ASSIGNED', 'IN_PROGRESS'],
            },
          },
        });
        
        const totalEnrollments = await prisma.enrollment.count();

        // Get AI token diagnostics
        const aiLogs = await prisma.auditLog.findMany({
          where: { action: 'AI_TOOL_USED' },
          select: { details: true },
        });
        let totalTokens = 0;
        const totalAiCalls = aiLogs.length;
        aiLogs.forEach((log) => {
          try {
            const stats = JSON.parse(log.details);
            totalTokens += stats.totalTokens || 0;
          } catch {}
        });

        const recentUploads = await prisma.document.findMany({
          include: {
            author: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });

        const recentSupportTickets = await prisma.supportTicket.findMany({
          include: {
            user: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });

        return {
          success: true,
          stats: {
            totalUsers,
            totalPapers,
            totalReviews,
            pendingReviews,
            activeServiceRequests,
            totalEnrollments,
            totalTokens,
            totalAiCalls,
            recentUploads,
            recentSupportTickets,
          },
        };
      } else if (role === 'INSTITUTION_ADMIN') {
        const instId = currentUser.institutionId;
        totalUsers = await prisma.user.count({ where: { institutionId: instId } });
        totalPapers = await prisma.document.count({
          where: {
            author: { institutionId: instId },
          },
        });
        totalReviews = await prisma.review.count({
          where: {
            reviewer: { institutionId: instId },
          },
        });
        pendingReviews = await prisma.review.count({
          where: {
            reviewer: { institutionId: instId },
            status: 'PENDING',
          },
        });
      } else if (role === 'FACULTY') {
        totalPapers = await prisma.document.count({
          where: { authorId: currentUser.id },
        });
        totalReviews = await prisma.review.count({
          where: { reviewerId: currentUser.id, NOT: { status: 'PENDING' } },
        });
        pendingReviews = await prisma.review.count({
          where: { reviewerId: currentUser.id, status: 'PENDING' },
        });
      } else {
        totalPapers = await prisma.document.count({
          where: { authorId: currentUser.id },
        });
        totalReviews = 0;
        pendingReviews = 0;
      }

      return {
        success: true,
        stats: {
          totalUsers,
          totalPapers,
          totalReviews,
          pendingReviews,
        },
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error' });
    }
  });

  // Lock/Unlock user (Super Admin / Admin only)
  fastify.put('/users/:id/lock', { preHandler: [fastify.requireRoles([UserRole.SUPER_ADMIN, UserRole.ADMIN])] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const currentUser = request.user as any;

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return reply.status(404).send({ success: false, message: 'User not found' });
      }

      // Prevent locking oneself
      if (user.id === currentUser.id) {
        return reply.status(400).send({ success: false, message: 'You cannot lock your own account' });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { isLocked: !user.isLocked },
      });

      const action = updatedUser.isLocked ? 'USER_LOCKED' : 'USER_UNLOCKED';
      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action,
          details: `${updatedUser.isLocked ? 'Locked' : 'Unlocked'} user ${user.email}`,
          ipAddress: request.ip,
        },
      });

      return {
        success: true,
        message: `User ${updatedUser.isLocked ? 'locked' : 'unlocked'} successfully`,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          isLocked: updatedUser.isLocked,
        },
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error locking/unlocking user' });
    }
  });

  // Delete user (Super Admin only)
  fastify.delete('/users/:id', { preHandler: [fastify.requireRoles([UserRole.SUPER_ADMIN])] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const currentUser = request.user as any;

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return reply.status(404).send({ success: false, message: 'User not found' });
      }

      // Prevent deleting oneself
      if (user.id === currentUser.id) {
        return reply.status(400).send({ success: false, message: 'You cannot delete your own account' });
      }

      await prisma.user.delete({ where: { id } });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'USER_DELETED',
          details: `Deleted user account ${user.email} (Name: ${user.name})`,
          ipAddress: request.ip,
        },
      });

      return {
        success: true,
        message: 'User deleted successfully',
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error deleting user' });
    }
  });

  // Get all support tickets (Super Admin / Admin only)
  fastify.get('/support-tickets', { preHandler: [fastify.requireRoles([UserRole.SUPER_ADMIN, UserRole.ADMIN])] }, async (request, reply) => {
    try {
      const tickets = await prisma.supportTicket.findMany({
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return { success: true, tickets };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error retrieving support tickets' });
    }
  });

  // Update support ticket status (Super Admin / Admin only)
  fastify.put('/support-tickets/:id/status', { preHandler: [fastify.requireRoles([UserRole.SUPER_ADMIN, UserRole.ADMIN])] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const currentUser = request.user as any;

      const updateTicketStatusSchema = z.object({
        status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const),
      });

      const parsed = updateTicketStatusSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, message: 'Invalid ticket status' });
      }

      const { status } = parsed.data;

      const ticket = await prisma.supportTicket.findUnique({ where: { id } });
      if (!ticket) {
        return reply.status(404).send({ success: false, message: 'Support ticket not found' });
      }

      const updated = await prisma.supportTicket.update({
        where: { id },
        data: { status },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'SUPPORT_TICKET_STATUS_UPDATED',
          details: `Updated support ticket ID ${id} status from ${ticket.status} to ${status}`,
          ipAddress: request.ip,
        },
      });

      return {
        success: true,
        message: 'Support ticket status updated successfully',
        ticket: updated,
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error updating ticket status' });
    }
  });
};
