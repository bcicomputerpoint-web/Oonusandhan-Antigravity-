import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { prisma, UserRole } from '@onusandhan/db';
import { z } from 'zod';

const createCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  price: z.number().nonnegative().default(0),
  published: z.boolean().default(false),
});

const updateCourseSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(5).optional(),
  price: z.number().nonnegative().optional(),
  published: z.boolean().optional(),
});

const moduleSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  orderIndex: z.number().int(),
});

const lessonSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  content: z.string().min(2, 'Content must be at least 2 characters'),
  videoUrl: z.string().nullable().optional(),
  orderIndex: z.number().int(),
});

const progressSchema = z.object({
  completed: z.boolean(),
});

const reorderSchema = z.object({
  direction: z.enum(['up', 'down']),
});

export const courseRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Helper to extract user if JWT is present
  const getUserFromRequest = (request: any): any => {
    try {
      const token = request.cookies.token;
      if (token) {
        return fastify.jwt.verify(token);
      }
    } catch (err) {
      // Ignore token verification errors for public routing enrichment
    }
    return null;
  };

  // 1. GET / - List all courses (enrich with enrollment if logged in)
  fastify.get('/', async (request, reply) => {
    try {
      const currentUser = getUserFromRequest(request);
      const isAdmin = currentUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN');

      // Fetch courses: guests/scholars only see published ones, admins see all
      const courses = await prisma.course.findMany({
        where: isAdmin ? {} : { published: true },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { modules: true },
          },
        },
      });

      // Enrich courses with enrollment status if scholar is logged in
      let enrichedCourses = courses.map((course) => ({
        ...course,
        isEnrolled: false,
        modulesCount: course._count.modules,
      }));

      if (currentUser && !isAdmin) {
        const enrollments = await prisma.enrollment.findMany({
          where: { userId: currentUser.id },
          select: { courseId: true },
        });
        const enrolledIds = new Set(enrollments.map((e) => e.courseId));
        enrichedCourses = enrichedCourses.map((c) => ({
          ...c,
          isEnrolled: enrolledIds.has(c.id),
        }));
      }

      return { success: true, courses: enrichedCourses };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error retrieving courses' });
    }
  });

  // 2. GET /enrolled - Scholar's enrolled courses with progress
  fastify.get('/enrolled', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const currentUser = request.user as any;

      const enrollments = await prisma.enrollment.findMany({
        where: { userId: currentUser.id },
        include: {
          course: {
            include: {
              modules: {
                orderBy: { orderIndex: 'asc' },
                include: {
                  lessons: { orderBy: { orderIndex: 'asc' } },
                },
              },
            },
          },
        },
      });

      // Calculate progress percentage for each enrolled course
      const enrichedEnrollments = await Promise.all(
        enrollments.map(async (enroll) => {
          const course = enroll.course;
          
          // Flatten lessons in this course
          const lessonsList = course.modules.flatMap((m) => m.lessons);
          const totalLessons = lessonsList.length;

          if (totalLessons === 0) {
            return {
              id: enroll.id,
              courseId: course.id,
              title: course.title,
              description: course.description,
              progressPercent: 0,
              totalLessons: 0,
              completedLessons: 0,
            };
          }

          const lessonIds = lessonsList.map((l) => l.id);
          const completedCount = await prisma.lessonProgress.count({
            where: {
              userId: currentUser.id,
              lessonId: { in: lessonIds },
              completed: true,
            },
          });

          const progressPercent = Math.round((completedCount / totalLessons) * 100);

          return {
            id: enroll.id,
            courseId: course.id,
            title: course.title,
            description: course.description,
            progressPercent,
            totalLessons,
            completedLessons: completedCount,
          };
        })
      );

      return { success: true, enrollments: enrichedEnrollments };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error retrieving enrolled courses' });
    }
  });

  // 3. GET /:id - Retrieve course details (protecting lesson contents if not enrolled)
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const currentUser = getUserFromRequest(request);
      
      const course = await prisma.course.findUnique({
        where: { id },
        include: {
          modules: {
            orderBy: { orderIndex: 'asc' },
            include: {
              lessons: {
                orderBy: { orderIndex: 'asc' },
              },
            },
          },
        },
      });

      if (!course) {
        return reply.status(404).send({ success: false, message: 'Course not found' });
      }

      // Check if user is enrolled
      let isEnrolled = false;
      const isAdmin = currentUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN');
      
      if (currentUser && !isAdmin) {
        const enrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: currentUser.id,
              courseId: id,
            },
          },
        });
        isEnrolled = !!enrollment;
      }

      // Fetch lesson progress completion statuses if enrolled
      let completedLessonIds = new Set<string>();
      if (currentUser && isEnrolled) {
        const progressList = await prisma.lessonProgress.findMany({
          where: {
            userId: currentUser.id,
            completed: true,
          },
          select: { lessonId: true },
        });
        completedLessonIds = new Set(progressList.map((p) => p.lessonId));
      }

      // Sanitize modules: hide content/videoUrl for non-enrolled non-admins
      const sanitizedModules = course.modules.map((mod) => ({
        ...mod,
        lessons: mod.lessons.map((lesson) => {
          const completed = completedLessonIds.has(lesson.id);
          const baseLesson = {
            id: lesson.id,
            moduleId: lesson.moduleId,
            title: lesson.title,
            orderIndex: lesson.orderIndex,
            completed,
          };

          if (isEnrolled || isAdmin) {
            return {
              ...baseLesson,
              content: lesson.content,
              videoUrl: lesson.videoUrl,
            };
          } else {
            return {
              ...baseLesson,
              content: 'Enroll in this course to view the full lesson content.',
              videoUrl: null,
            };
          }
        }),
      }));

      return {
        success: true,
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          price: course.price,
          published: course.published,
          isEnrolled: isEnrolled || isAdmin,
          modules: sanitizedModules,
        },
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error retrieving course details' });
    }
  });

  // 4. POST /:id/enroll - Enroll scholar in a course
  fastify.post('/:id/enroll', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const currentUser = request.user as any;

      const course = await prisma.course.findUnique({ where: { id } });
      if (!course) {
        return reply.status(404).send({ success: false, message: 'Course not found' });
      }

      // Check if already enrolled
      const existing = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: currentUser.id,
            courseId: id,
          },
        },
      });

      if (existing) {
        return reply.status(400).send({ success: false, message: 'Already enrolled in this course' });
      }

      const enrollment = await prisma.enrollment.create({
        data: {
          userId: currentUser.id,
          courseId: id,
        },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'COURSE_ENROLLED',
          details: `Enrolled in course: ${course.title} (ID: ${course.id})`,
          ipAddress: request.ip,
        },
      });

      return { success: true, message: 'Enrolled successfully', enrollment };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error enrolling in course' });
    }
  });

  // 5. POST /lessons/:lessonId/progress - Mark lesson complete/incomplete
  fastify.post('/lessons/:lessonId/progress', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { lessonId } = request.params as { lessonId: string };
      const currentUser = request.user as any;

      const parsed = progressSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, message: 'Invalid body inputs' });
      }

      const { completed } = parsed.data;

      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { module: true },
      });

      if (!lesson) {
        return reply.status(404).send({ success: false, message: 'Lesson not found' });
      }

      // Verify user is enrolled
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: currentUser.id,
            courseId: lesson.module.courseId,
          },
        },
      });

      if (!enrollment) {
        return reply.status(403).send({ success: false, message: 'You must enroll in this course to mark progress' });
      }

      const progress = await prisma.lessonProgress.upsert({
        where: {
          userId_lessonId: {
            userId: currentUser.id,
            lessonId,
          },
        },
        update: {
          completed,
          completedAt: completed ? new Date() : null,
        },
        create: {
          userId: currentUser.id,
          lessonId,
          completed,
          completedAt: completed ? new Date() : null,
        },
      });

      return { success: true, progress };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error updating progress' });
    }
  });

  // ==========================================
  // ADMINISTRATIVE WORKSPACE ROUTES (Admin only)
  // ==========================================

  // 6. POST / - Create new course
  fastify.post('/', { preHandler: [fastify.authenticate, fastify.requireRoles([UserRole.SUPER_ADMIN, UserRole.ADMIN])] }, async (request, reply) => {
    const currentUser = request.user as any;

    try {
      const parsed = createCourseSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, message: parsed.error.issues[0]?.message });
      }

      const course = await prisma.course.create({
        data: parsed.data,
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'COURSE_CREATED',
          details: `Created new course: ${course.title}`,
          ipAddress: request.ip,
        },
      });

      return { success: true, course };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error creating course' });
    }
  });

  // 7. PUT /:id - Update course metadata
  fastify.put('/:id', { preHandler: [fastify.authenticate, fastify.requireRoles([UserRole.SUPER_ADMIN, UserRole.ADMIN])] }, async (request, reply) => {
    const currentUser = request.user as any;

    try {
      const { id } = request.params as { id: string };
      const parsed = updateCourseSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, message: 'Invalid update inputs' });
      }

      const course = await prisma.course.findUnique({ where: { id } });
      if (!course) {
        return reply.status(404).send({ success: false, message: 'Course not found' });
      }

      const updated = await prisma.course.update({
        where: { id },
        data: parsed.data,
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'COURSE_UPDATED',
          details: `Updated course: ${course.title}. Params: ${JSON.stringify(parsed.data)}`,
          ipAddress: request.ip,
        },
      });

      return { success: true, course: updated };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error updating course' });
    }
  });

  // 8. DELETE /:id - Delete course
  fastify.delete('/:id', { preHandler: [fastify.authenticate, fastify.requireRoles([UserRole.SUPER_ADMIN, UserRole.ADMIN])] }, async (request, reply) => {
    const currentUser = request.user as any;

    try {
      const { id } = request.params as { id: string };
      const course = await prisma.course.findUnique({ where: { id } });
      if (!course) {
        return reply.status(404).send({ success: false, message: 'Course not found' });
      }

      await prisma.course.delete({ where: { id } });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'COURSE_DELETED',
          details: `Deleted course: ${course.title} (ID: ${id})`,
          ipAddress: request.ip,
        },
      });

      return { success: true, message: 'Course deleted successfully' };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error deleting course' });
    }
  });

  // 9. POST /:id/modules - Create a module
  fastify.post('/:id/modules', { preHandler: [fastify.authenticate, fastify.requireRoles([UserRole.SUPER_ADMIN, UserRole.ADMIN])] }, async (request, reply) => {
    const currentUser = request.user as any;

    try {
      const { id } = request.params as { id: string };
      const parsed = moduleSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, message: parsed.error.issues[0]?.message });
      }

      const course = await prisma.course.findUnique({ where: { id } });
      if (!course) {
        return reply.status(404).send({ success: false, message: 'Course not found' });
      }

      const mod = await prisma.courseModule.create({
        data: {
          courseId: id,
          title: parsed.data.title,
          description: parsed.data.description,
          orderIndex: parsed.data.orderIndex,
        },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'MODULE_CREATED',
          details: `Created course module: ${mod.title} (ID: ${mod.id}) in course ${course.title} (ID: ${id})`,
          ipAddress: request.ip,
        },
      });

      return { success: true, module: mod };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error creating module' });
    }
  });

  // 10. PUT /modules/:moduleId - Update a module
  fastify.put('/modules/:moduleId', { preHandler: [fastify.authenticate, fastify.requireRoles([UserRole.SUPER_ADMIN, UserRole.ADMIN])] }, async (request, reply) => {
    const currentUser = request.user as any;

    try {
      const { moduleId } = request.params as { moduleId: string };
      const parsed = moduleSchema.partial().safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, message: 'Invalid module update data' });
      }

      const mod = await prisma.courseModule.findUnique({ where: { id: moduleId } });
      if (!mod) {
        return reply.status(404).send({ success: false, message: 'Module not found' });
      }

      const updated = await prisma.courseModule.update({
        where: { id: moduleId },
        data: parsed.data,
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'MODULE_UPDATED',
          details: `Updated course module: ${mod.title} (ID: ${moduleId}). Data: ${JSON.stringify(parsed.data)}`,
          ipAddress: request.ip,
        },
      });

      return { success: true, module: updated };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error updating module' });
    }
  });

  // 11. DELETE /modules/:moduleId - Delete a module
  fastify.delete('/modules/:moduleId', { preHandler: [fastify.authenticate, fastify.requireRoles([UserRole.SUPER_ADMIN, UserRole.ADMIN])] }, async (request, reply) => {
    const currentUser = request.user as any;

    try {
      const { moduleId } = request.params as { moduleId: string };
      const mod = await prisma.courseModule.findUnique({ where: { id: moduleId } });
      if (!mod) {
        return reply.status(404).send({ success: false, message: 'Module not found' });
      }

      await prisma.courseModule.delete({ where: { id: moduleId } });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'MODULE_DELETED',
          details: `Deleted course module: ${mod.title} (ID: ${moduleId})`,
          ipAddress: request.ip,
        },
      });

      return { success: true, message: 'Module deleted successfully' };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error deleting module' });
    }
  });

  // 12. POST /modules/:moduleId/lessons - Create a lesson
  fastify.post('/modules/:moduleId/lessons', { preHandler: [fastify.authenticate, fastify.requireRoles([UserRole.SUPER_ADMIN, UserRole.ADMIN])] }, async (request, reply) => {
    const currentUser = request.user as any;

    try {
      const { moduleId } = request.params as { moduleId: string };
      const parsed = lessonSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, message: parsed.error.issues[0]?.message });
      }

      const mod = await prisma.courseModule.findUnique({ where: { id: moduleId } });
      if (!mod) {
        return reply.status(404).send({ success: false, message: 'Module not found' });
      }

      const lesson = await prisma.lesson.create({
        data: {
          moduleId,
          title: parsed.data.title,
          content: parsed.data.content,
          videoUrl: parsed.data.videoUrl,
          orderIndex: parsed.data.orderIndex,
        },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'LESSON_CREATED',
          details: `Created lesson: ${lesson.title} (ID: ${lesson.id}) in module ${mod.title} (ID: ${moduleId})`,
          ipAddress: request.ip,
        },
      });

      return { success: true, lesson };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error creating lesson' });
    }
  });

  // 13. PUT /lessons/:lessonId - Update a lesson
  fastify.put('/lessons/:lessonId', { preHandler: [fastify.authenticate, fastify.requireRoles([UserRole.SUPER_ADMIN, UserRole.ADMIN])] }, async (request, reply) => {
    const currentUser = request.user as any;

    try {
      const { lessonId } = request.params as { lessonId: string };
      const parsed = lessonSchema.partial().safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, message: 'Invalid lesson update data' });
      }

      const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
      if (!lesson) {
        return reply.status(404).send({ success: false, message: 'Lesson not found' });
      }

      const updated = await prisma.lesson.update({
        where: { id: lessonId },
        data: parsed.data,
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'LESSON_UPDATED',
          details: `Updated lesson: ${lesson.title} (ID: ${lessonId}). Data: ${JSON.stringify(parsed.data)}`,
          ipAddress: request.ip,
        },
      });

      return { success: true, lesson: updated };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error updating lesson' });
    }
  });

  // 14. DELETE /lessons/:lessonId - Delete a lesson
  fastify.delete('/lessons/:lessonId', { preHandler: [fastify.authenticate, fastify.requireRoles([UserRole.SUPER_ADMIN, UserRole.ADMIN])] }, async (request, reply) => {
    const currentUser = request.user as any;

    try {
      const { lessonId } = request.params as { lessonId: string };
      const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
      if (!lesson) {
        return reply.status(404).send({ success: false, message: 'Lesson not found' });
      }

      await prisma.lesson.delete({ where: { id: lessonId } });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'LESSON_DELETED',
          details: `Deleted lesson: ${lesson.title} (ID: ${lessonId})`,
          ipAddress: request.ip,
        },
      });

      return { success: true, message: 'Lesson deleted successfully' };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error deleting lesson' });
    }
  });

  // 15. PUT /lessons/:lessonId/reorder - Reorder lesson (swap with adjacent)
  fastify.put('/lessons/:lessonId/reorder', { preHandler: [fastify.authenticate, fastify.requireRoles([UserRole.SUPER_ADMIN, UserRole.ADMIN])] }, async (request, reply) => {
    const currentUser = request.user as any;

    try {
      const { lessonId } = request.params as { lessonId: string };
      const parsed = reorderSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, message: 'Invalid reorder direction. Must be up or down.' });
      }

      const { direction } = parsed.data;

      const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
      if (!lesson) {
        return reply.status(404).send({ success: false, message: 'Lesson not found' });
      }

      const moduleId = lesson.moduleId;
      const currentOrder = lesson.orderIndex;

      // Find adjacent lesson in same module
      let adjacentLesson;
      if (direction === 'up') {
        adjacentLesson = await prisma.lesson.findFirst({
          where: {
            moduleId,
            orderIndex: { lt: currentOrder },
          },
          orderBy: { orderIndex: 'desc' },
        });
      } else {
        adjacentLesson = await prisma.lesson.findFirst({
          where: {
            moduleId,
            orderIndex: { gt: currentOrder },
          },
          orderBy: { orderIndex: 'asc' },
        });
      }

      if (!adjacentLesson) {
        return reply.status(400).send({ success: false, message: `No adjacent lesson found to swap ${direction}` });
      }

      // Swap their orderIndex fields in a transaction
      await prisma.$transaction([
        prisma.lesson.update({
          where: { id: lessonId },
          data: { orderIndex: adjacentLesson.orderIndex },
        }),
        prisma.lesson.update({
          where: { id: adjacentLesson.id },
          data: { orderIndex: currentOrder },
        }),
      ]);

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'LESSON_REORDERED',
          details: `Reordered lesson: swapped ${lesson.title} (ID: ${lessonId}) with ${adjacentLesson.title} (ID: ${adjacentLesson.id})`,
          ipAddress: request.ip,
        },
      });

      return { success: true, message: 'Lessons reordered successfully' };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error reordering lessons' });
    }
  });
};
