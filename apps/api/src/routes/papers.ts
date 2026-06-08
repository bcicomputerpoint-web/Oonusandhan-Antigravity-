import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { prisma, UserRole, DocumentCategory } from '@onusandhan/db';
import fs from 'fs';
import path from 'path';

const uploadDir = path.join(process.cwd(), '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const paperRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Pre-handler auth gate
  fastify.addHook('preHandler', fastify.authenticate);

  // Submit research paper (Multipart upload)
  fastify.post('/', async (request, reply) => {
    try {
      if (!request.isMultipart()) {
        return reply.status(400).send({ success: false, message: 'Multipart request required' });
      }

      const parts = request.parts();
      let title = '';
      let abstract = '';
      let keywords: string[] = [];
      let fileBuffer: Buffer | null = null;
      let filename = '';
      let category = 'OTHER';
      let mimeType = '';

      for await (const part of parts) {
        if (part.type === 'file') {
          if (part.fieldname === 'manuscript') {
            filename = path.basename(part.filename);
            mimeType = part.mimetype;
            
            fileBuffer = await part.toBuffer();
            if (fileBuffer.length > 10 * 1024 * 1024) {
              return reply.status(400).send({
                success: false,
                message: 'Manuscript file exceeds size limit of 10MB',
              });
            }

            const allowedTypes = [
              'application/pdf',
              'image/png',
              'image/jpeg',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];
            if (!allowedTypes.includes(mimeType)) {
              return reply.status(400).send({
                success: false,
                message: 'Unsupported manuscript file type. Allowed: PDF, PNG, JPG, DOC, DOCX',
              });
            }

            // Verify file magic bytes content signature
            let isValidContent = false;
            if (mimeType === 'application/pdf') {
              isValidContent = fileBuffer.length >= 4 && 
                fileBuffer[0] === 0x25 && // %
                fileBuffer[1] === 0x50 && // P
                fileBuffer[2] === 0x44 && // D
                fileBuffer[3] === 0x46;   // F
            } else if (mimeType === 'image/png') {
              isValidContent = fileBuffer.length >= 4 &&
                fileBuffer[0] === 0x89 &&
                fileBuffer[1] === 0x50 &&
                fileBuffer[2] === 0x4E &&
                fileBuffer[3] === 0x47;
            } else if (mimeType === 'image/jpeg') {
              isValidContent = fileBuffer.length >= 3 &&
                fileBuffer[0] === 0xFF &&
                fileBuffer[1] === 0xD8 &&
                fileBuffer[2] === 0xFF;
            } else if (mimeType === 'application/msword') {
              isValidContent = fileBuffer.length >= 4 &&
                fileBuffer[0] === 0xD0 &&
                fileBuffer[1] === 0xCF &&
                fileBuffer[2] === 0x11 &&
                fileBuffer[3] === 0xE0;
            } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
              isValidContent = fileBuffer.length >= 4 &&
                fileBuffer[0] === 0x50 &&
                fileBuffer[1] === 0x4B &&
                fileBuffer[2] === 0x03 &&
                fileBuffer[3] === 0x04;
            }

            if (!isValidContent) {
              return reply.status(400).send({
                success: false,
                message: 'File content does not match the claimed MIME type or is corrupted',
              });
            }
          }
        } else {
          if (part.fieldname === 'title') title = part.value as string;
          if (part.fieldname === 'abstract') abstract = part.value as string;
          if (part.fieldname === 'category') category = (part.value as string).toUpperCase();
          if (part.fieldname === 'keywords') {
            try {
              keywords = JSON.parse(part.value as string);
            } catch {
              keywords = (part.value as string).split(',').map((k) => k.trim());
            }
          }
        }
      }

      if (!title || !abstract || !fileBuffer) {
        return reply.status(400).send({
          success: false,
          message: 'Title, abstract and manuscript file are required',
        });
      }

      const currentUser = request.user as any;

      const validCategories = Object.values(DocumentCategory);
      const docCategory = validCategories.includes(category as any)
        ? (category as DocumentCategory)
        : DocumentCategory.OTHER;

      // Save file securely locally
      const secureFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${filename}`;
      const filePath = path.join(uploadDir, secureFileName);
      await fs.promises.writeFile(filePath, fileBuffer);

      // Create Document in database
      const paper = await prisma.document.create({
        data: {
          title,
          abstract,
          keywords,
          fileUrl: secureFileName,
          category: docCategory,
          fileSize: fileBuffer.length,
          mimeType: mimeType,
          status: 'SUBMITTED',
          authorId: currentUser.id,
        },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'PAPER_SUBMITTED',
          details: `Submitted research paper: ${title} (ID: ${paper.id})`,
          ipAddress: request.ip,
        },
      });

      return {
        success: true,
        message: 'Research paper submitted successfully',
        paperId: paper.id,
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error during submission' });
    }
  });

  // Get papers list (Adapts based on role)
  fastify.get('/', async (request, reply) => {
    try {
      const currentUser = request.user as any;
      const role = currentUser.role as UserRole;

      let papers;

      if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
        papers = await prisma.document.findMany({
          include: {
            author: { select: { name: true, email: true } },
            reviews: true,
          },
          orderBy: { createdAt: 'desc' },
        });
      } else if (role === 'INSTITUTION_ADMIN') {
        papers = await prisma.document.findMany({
          where: {
            author: {
              institutionId: currentUser.institutionId,
            },
          },
          include: {
            author: { select: { name: true, email: true } },
            reviews: true,
          },
          orderBy: { createdAt: 'desc' },
        });
      } else if (role === 'FACULTY') {
        papers = await prisma.document.findMany({
          where: {
            OR: [
              {
                authorId: currentUser.id,
              },
              {
                reviews: {
                  some: {
                    reviewerId: currentUser.id,
                  },
                },
              },
            ],
          },
          include: {
            author: { select: { name: true, email: true } },
            reviews: {
              where: { reviewerId: currentUser.id },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      } else {
        papers = await prisma.document.findMany({
          where: {
            authorId: currentUser.id,
          },
          include: {
            author: { select: { name: true, email: true } },
            reviews: true,
          },
          orderBy: { createdAt: 'desc' },
        });
      }

      return {
        success: true,
        papers,
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error' });
    }
  });

  // Get specific paper details
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const currentUser = request.user as any;
      const role = currentUser.role as UserRole;

      const paper = await prisma.document.findUnique({
        where: { id },
        include: {
          author: { select: { id: true, name: true, email: true, institutionId: true } },
          reviews: { include: { reviewer: { select: { name: true, email: true } } } },
        },
      });

      if (!paper) {
        return reply.status(404).send({ success: false, message: 'Paper not found' });
      }

      const isAuthor = paper.authorId === currentUser.id;
      const isReviewer = paper.reviews.some((rev: any) => rev.reviewerId === currentUser.id);
      const isInstAdmin = role === 'INSTITUTION_ADMIN' && paper.author.institutionId === currentUser.institutionId;
      const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';

      if (!isAuthor && !isReviewer && !isInstAdmin && !isAdmin) {
        return reply.status(403).send({ success: false, message: 'Access denied to paper details' });
      }

      return {
        success: true,
        paper,
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error' });
    }
  });

  // Secure manuscript download
  fastify.get('/:id/download', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const currentUser = request.user as any;
      const role = currentUser.role as UserRole;

      const paper = await prisma.document.findUnique({
        where: { id },
        include: {
          author: { select: { id: true, institutionId: true } },
          reviews: { select: { reviewerId: true } },
        },
      });

      if (!paper) {
        return reply.status(404).send({ success: false, message: 'Paper not found' });
      }

      const isAuthor = paper.authorId === currentUser.id;
      const isReviewer = paper.reviews.some((rev: any) => rev.reviewerId === currentUser.id);
      const isInstAdmin = role === 'INSTITUTION_ADMIN' && paper.author.institutionId === currentUser.institutionId;
      const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';

      if (!isAuthor && !isReviewer && !isInstAdmin && !isAdmin) {
        return reply.status(403).send({ success: false, message: 'Access denied to download manuscript' });
      }

      const filePath = path.join(uploadDir, paper.fileUrl);

      if (!fs.existsSync(filePath)) {
        return reply.status(404).send({ success: false, message: 'Manuscript file not found on disk' });
      }

      const stream = fs.createReadStream(filePath);
      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `attachment; filename="${paper.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`);
      return reply.send(stream);
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error during download' });
    }
  });

  // Delete document
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const currentUser = request.user as any;
      const role = currentUser.role as UserRole;

      const paper = await prisma.document.findUnique({
        where: { id },
      });

      if (!paper) {
        return reply.status(404).send({ success: false, message: 'Document not found' });
      }

      const isAuthor = paper.authorId === currentUser.id;
      const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';

      if (!isAuthor && !isAdmin) {
        return reply.status(403).send({ success: false, message: 'Access denied to delete document' });
      }

      const filePath = path.join(uploadDir, paper.fileUrl);
      try {
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      } catch (err) {
        request.log.error(`Failed to delete file from disk: ${filePath}`);
      }

      await prisma.document.delete({
        where: { id },
      });

      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'DOCUMENT_DELETED',
          details: `Deleted document: ${paper.title} (ID: ${paper.id})`,
          ipAddress: request.ip,
        },
      });

      return {
        success: true,
        message: 'Document deleted successfully',
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error during deletion' });
    }
  });
};
