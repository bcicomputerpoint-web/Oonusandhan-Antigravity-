import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { prisma, ReviewStatus, UserRole } from '@onusandhan/db';
import { z } from 'zod';

const reviewSubmissionSchema = z.object({
  paperId: z.string(), // we'll map this internally to documentId
  score: z.number().min(1).max(5),
  comments: z.string().min(10),
  recommendations: z.string().min(5),
  status: z.enum(['ACCEPTED', 'REJECTED'] as const),
});

const assignmentSchema = z.object({
  paperId: z.string(),
  reviewerId: z.string(),
});

export const reviewRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', fastify.authenticate);

  // Submit review for a paper
  fastify.post('/', { preHandler: [fastify.requireRoles([UserRole.FACULTY, UserRole.ADMIN, UserRole.SUPER_ADMIN])] }, async (request, reply) => {
    try {
      const parsed = reviewSubmissionSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid review fields',
          errors: parsed.error.flatten(),
        });
      }

      const { paperId, score, comments, recommendations, status } = parsed.data;
      const currentUser = request.user as any;

      // Check if assignment exists
      const assignment = await prisma.review.findFirst({
        where: {
          documentId: paperId,
          reviewerId: currentUser.id,
          status: 'PENDING',
        },
      });

      if (!assignment && currentUser.role === 'FACULTY') {
        return reply.status(403).send({
          success: false,
          message: 'You are not assigned to review this paper',
        });
      }

      let review;
      if (assignment) {
        review = await prisma.review.update({
          where: { id: assignment.id },
          data: {
            score,
            comments,
            recommendations,
            status: status as ReviewStatus,
          },
        });
      } else {
        review = await prisma.review.create({
          data: {
            documentId: paperId,
            reviewerId: currentUser.id,
            score,
            comments,
            recommendations,
            status: status as ReviewStatus,
          },
        });
      }

      // Update paper status
      await prisma.document.update({
        where: { id: paperId },
        data: {
          status: 'PEER_REVIEWED',
        },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'REVIEW_SUBMITTED',
          details: `Submitted review for document ID: ${paperId}, recommendation: ${status}`,
          ipAddress: request.ip,
        },
      });

      return {
        success: true,
        message: 'Peer review submitted successfully',
        reviewId: review.id,
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error' });
    }
  });

  // Assign reviewer to paper (Platform / Super Admin only)
  fastify.post('/assign', { preHandler: [fastify.requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN])] }, async (request, reply) => {
    try {
      const parsed = assignmentSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid assignment parameters',
          errors: parsed.error.flatten(),
        });
      }

      const { paperId, reviewerId } = parsed.data;
      const currentUser = request.user as any;

      // Verify reviewer
      const reviewer = await prisma.user.findUnique({ where: { id: reviewerId } });
      if (!reviewer || (reviewer.role !== 'FACULTY' && reviewer.role !== 'SUPER_ADMIN')) {
        return reply.status(400).send({
          success: false,
          message: 'Assigned reviewer must have a Faculty/Researcher role',
        });
      }

      // Verify paper
      const paper = await prisma.document.findUnique({ where: { id: paperId } });
      if (!paper) {
        return reply.status(404).send({ success: false, message: 'Paper not found' });
      }

      // Check if already assigned
      const existing = await prisma.review.findFirst({
        where: {
          documentId: paperId,
          reviewerId,
        },
      });

      if (existing) {
        return reply.status(400).send({
          success: false,
          message: 'Reviewer already assigned to this paper',
        });
      }

      const review = await prisma.review.create({
        data: {
          documentId: paperId,
          reviewerId,
          score: 0,
          comments: '',
          recommendations: '',
          status: 'PENDING',
        },
      });

      // Update paper status
      await prisma.document.update({
        where: { id: paperId },
        data: { status: 'UNDER_REVIEW' },
      });

      // Create notification for reviewer
      await prisma.notification.create({
        data: {
          userId: reviewerId,
          message: `You have been assigned to review paper: "${paper.title}"`,
        },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'REVIEWER_ASSIGNED',
          details: `Assigned Faculty ${reviewer.name} to paper: ${paper.title}`,
          ipAddress: request.ip,
        },
      });

      return {
        success: true,
        message: 'Reviewer assigned successfully',
        assignmentId: review.id,
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error' });
    }
  });

  // Get current logged-in reviewer's assignments
  fastify.get('/my-assignments', { preHandler: [fastify.requireRoles([UserRole.FACULTY, UserRole.SUPER_ADMIN])] }, async (request, reply) => {
    try {
      const currentUser = request.user as any;

      const assignments = await prisma.review.findMany({
        where: {
          reviewerId: currentUser.id,
        },
        include: {
          document: {
            include: {
              author: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        assignments: assignments.map((a) => ({
          id: a.id,
          reviewerId: a.reviewerId,
          score: a.score,
          comments: a.comments,
          recommendations: a.recommendations,
          status: a.status,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
          paper: a.document, // map to paper for frontend compatibility!
        })),
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error' });
    }
  });
};
