import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding with expanded model sets...');

  // 1. Seed Service Wings
  const wings = [
    {
      name: 'Research Topic Selection',
      description: 'Guidance in identifying trending, high-impact research topics and domain gaps matching your specializations.',
      priceRate: 50.0,
    },
    {
      name: 'Synopsis and Proposal Support',
      description: 'Comprehensive synopsis building, problem statements formatting, and technical proposal reviews.',
      priceRate: 100.0,
    },
    {
      name: 'Literature Review Support',
      description: 'Thematic literature synthesis, methodology cataloging, citation checking, and research gap formulation.',
      priceRate: 80.0,
    },
    {
      name: 'Publication Support',
      description: 'Draft optimization, journal layout formatting, technical proofreading, and submission support for Q1 journals.',
      priceRate: 150.0,
    },
    {
      name: 'PhD Admission Support',
      description: 'Application tracking, statement of purpose (SOP) reviews, academic CV design, and admission interviews preparation.',
      priceRate: 120.0,
    },
    {
      name: 'Academic Profile Management',
      description: 'Setting up, indexing, and optimizing professional academic portfolios across online university directories.',
      priceRate: 40.0,
    },
    {
      name: 'Research ID Support',
      description: 'Registration, linkage audits, and indexing support for ORCID, Google Scholar, ResearchGate, and Scopus profiles.',
      priceRate: 30.0,
    },
    {
      name: 'Training and Courses',
      description: 'Technical research writing, statistical computation, scientific graphing, and custom classroom analytics courses.',
      priceRate: 90.0,
    },
  ];

  for (const w of wings) {
    await prisma.serviceWing.upsert({
      where: { name: w.name },
      update: {
        description: w.description,
        priceRate: w.priceRate,
      },
      create: w,
    });
  }
  console.log('🏫 Seeded Service Wings');

  // 2. Seed Courses, Modules, and Lessons
  const courses = [
    {
      title: 'Technical Writing for Scientific Journals',
      description: 'Learn the principles of technical writing, structuring abstracts, formatting tables, and navigating submission systems.',
      price: 99.0,
      modules: [
        {
          title: 'Module 1: Layout & Structures',
          description: 'Basic academic document patterns.',
          orderIndex: 1,
          lessons: [
            {
              title: 'Lesson 1.1: Writing abstracts that captivate editors',
              content: 'Abstracts are the window to your paper. They must contain the context, problem statement, methodology, results, and implications within 250 words.',
              orderIndex: 1,
            },
            {
              title: 'Lesson 1.2: Formatting citation links cleanly',
              content: 'Understand the difference between APA, MLA, IEEE, and Chicago styles, and how referencing managers automate these.',
              orderIndex: 2,
            },
          ],
        },
      ],
    },
    {
      title: 'Statistical Computation & Visualization with R',
      description: 'Hands-on training in statistical methodologies: ggplot2, tidyverse, regression modeling, and reporting.',
      price: 149.0,
      modules: [
        {
          title: 'Module 1: Tidy Data & Setup',
          description: 'Setting up R Studio and importing data.',
          orderIndex: 1,
          lessons: [
            {
              title: 'Lesson 1.1: Basic vector arithmetic in R',
              content: 'Learn how variables, arrays, lists, and dataframes form the fundamental structures of data science in R.',
              orderIndex: 1,
            },
          ],
        },
      ],
    },
  ];

  for (const c of courses) {
    const createdCourse = await prisma.course.upsert({
      where: { title: c.title },
      update: {},
      create: {
        title: c.title,
        description: c.description,
        price: c.price,
      },
    });

    for (const m of c.modules) {
      const createdModule = await prisma.courseModule.create({
        data: {
          courseId: createdCourse.id,
          title: m.title,
          description: m.description,
          orderIndex: m.orderIndex,
        },
      });

      for (const l of m.lessons) {
        await prisma.lesson.create({
          data: {
            moduleId: createdModule.id,
            title: l.title,
            content: l.content,
            orderIndex: l.orderIndex,
          },
        });
      }
    }
  }
  console.log('📚 Seeded Courses, Modules, and Lessons');

  // 3. Seed Users & Profiles
  const userPasswordHash = await bcrypt.hash('AdminPassword123!', 10);

  const users = [
    {
      email: 'superadmin@onusandhan.ai',
      name: 'Super Director Rahman',
      role: 'SUPER_ADMIN' as const,
      profile: {
        bio: 'Chief Academic Director and platform oversight supervisor at Onusandhan AI.',
        phone: '+8801700000001',
        specialization: 'High Performance Computing',
      },
    },
    {
      email: 'reviewer@onusandhan.ai',
      name: 'Dr. Fatima Khan',
      role: 'FACULTY' as const,
      profile: {
        bio: 'Senior Lecturer at Dhaka University, specialized in Quantitative Methodologies.',
        phone: '+8801700000002',
        specialization: 'Statistical Modeling',
      },
    },
    {
      email: 'scholar@onusandhan.ai',
      name: 'Imtiaz Ahmed',
      role: 'SCHOLAR' as const,
      profile: {
        bio: 'Graduate researcher investigating machine translation architectures for low-resource languages.',
        phone: '+8801700000003',
        specialization: 'Natural Language Processing',
      },
    },
  ];

  for (const u of users) {
    const createdUser = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash: userPasswordHash,
        name: u.name,
        role: u.role,
      },
    });

    await prisma.profile.upsert({
      where: { userId: createdUser.id },
      update: {},
      create: {
        userId: createdUser.id,
        bio: u.profile.bio,
        phone: u.profile.phone,
        specialization: u.profile.specialization,
      },
    });
  }
  console.log('👥 Seeded Users and Profiles');

  console.log('✅ Expanded database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
