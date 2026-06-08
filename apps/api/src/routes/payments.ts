import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { prisma, UserRole } from '@onusandhan/db';
import { z } from 'zod';
import { PaymentServiceFactory } from '../services/payment.service';

const createOrderSchema = z.object({
  planName: z.enum(['FREE', 'PRO', 'LABS']),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
});

export const paymentRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // 1. POST /create-order - Initiate order flow (Gated)
  fastify.post('/create-order', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const parsed = createOrderSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          message: parsed.error.issues[0]?.message || 'Invalid parameters',
        });
      }

      const { planName, amount, currency } = parsed.data;
      const currentUser = request.user as any;

      const provider = PaymentServiceFactory.getProvider();
      const orderResult = await provider.createOrder({
        userId: currentUser.id,
        amount,
        currency,
        planName,
        metadata: { userId: currentUser.id, planName },
      });

      // Save a pending payment record in the database
      const payment = await prisma.payment.create({
        data: {
          userId: currentUser.id,
          amount,
          currency,
          status: 'PENDING',
          txRef: orderResult.orderId,
          planName,
        },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'PAYMENT_ORDER_CREATED',
          details: `Created payment order for plan: ${planName}, amount: ${amount} (TxRef: ${orderResult.orderId})`,
          ipAddress: request.ip,
        },
      });

      return {
        success: true,
        message: 'Payment order generated successfully',
        paymentId: payment.id,
        order: orderResult,
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Order creation server error' });
    }
  });

  // 2. POST /webhook - Signature verified webhook endpoint (Public)
  fastify.post('/webhook', async (request, reply) => {
    try {
      const headers = request.headers as Record<string, string>;
      
      // Get body string representation safely
      let rawBody = '';
      if (typeof request.body === 'string') {
        rawBody = request.body;
      } else if (request.body && typeof request.body === 'object') {
        rawBody = JSON.stringify(request.body);
      }

      const provider = PaymentServiceFactory.getProvider();
      const verification = await provider.verifyWebhook(headers, rawBody);

      if (!verification.isValid) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid signature or unauthorized webhook call',
        });
      }

      const { txRef, status } = verification;

      // Find the payment record
      const payment = await prisma.payment.findUnique({
        where: { txRef },
        include: { user: true }
      });

      if (!payment) {
        return reply.status(404).send({
          success: false,
          message: `Payment record not found for transaction reference: ${txRef}`,
        });
      }

      // If already processed, return early
      if (payment.status !== 'PENDING') {
        return { success: true, message: 'Webhook already processed' };
      }

      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status },
      });

      if (status === 'COMPLETED' && payment.planName) {
        // Upgrade user plan
        await prisma.user.update({
          where: { id: payment.userId },
          data: { plan: payment.planName },
        });

        // Add System Audit Log
        await prisma.auditLog.create({
          data: {
            userId: payment.userId,
            action: 'PAYMENT_COMPLETED',
            details: `Upgraded user ${payment.user.email} plan to ${payment.planName} (TxRef: ${txRef})`,
            ipAddress: request.ip,
          },
        });
        
        // Add Notification
        await prisma.notification.create({
          data: {
            userId: payment.userId,
            message: `Congratulations! Your payment of ${payment.amount} ${payment.currency} was processed successfully. You are now upgraded to the ${payment.planName} plan.`,
          }
        });
      } else if (status === 'FAILED') {
        // Add System Audit Log
        await prisma.auditLog.create({
          data: {
            userId: payment.userId,
            action: 'PAYMENT_FAILED',
            details: `Failed transaction for user ${payment.user.email} plan ${payment.planName} (TxRef: ${txRef})`,
            ipAddress: request.ip,
          },
        });
      }

      return { success: true, message: 'Webhook processed successfully' };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Webhook server error' });
    }
  });

  // 3. GET /history - Get scholar's payment transactions (Gated)
  fastify.get('/history', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const currentUser = request.user as any;

      const payments = await prisma.payment.findMany({
        where: { userId: currentUser.id },
        orderBy: { createdAt: 'desc' },
      });

      return { success: true, payments };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error retrieving payment history' });
    }
  });

  // 4. GET /admin/overview - Admin view of all transactions (Admin/Super Admin only)
  fastify.get('/admin/overview', { preHandler: [fastify.authenticate, fastify.requireRoles([UserRole.SUPER_ADMIN, UserRole.ADMIN])] }, async (request, reply) => {
    try {
      const payments = await prisma.payment.findMany({
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

      // Calculate Financial Stats
      const totalRevenue = payments
        .filter((p) => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + p.amount, 0);

      const totalTransactions = payments.length;
      const successTransactions = payments.filter((p) => p.status === 'COMPLETED').length;
      const successRate = totalTransactions > 0 ? Math.round((successTransactions / totalTransactions) * 100) : 100;

      // Count of distinct active subscribers (Users with non-FREE plans)
      const activeSubscribersCount = await prisma.user.count({
        where: {
          plan: { not: 'FREE' },
        },
      });

      return {
        success: true,
        stats: {
          totalRevenue,
          successRate,
          activeSubscribersCount,
          totalTransactions,
        },
        payments,
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error retrieving financial summaries' });
    }
  });
};
