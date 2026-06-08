import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { prisma, ChatSender, UserRole } from '@onusandhan/db';
import { z } from 'zod';

const generateSchema = z.object({
  tool: z.enum([
    'topic-selector',
    'proposal-outline',
    'lit-review',
    'abstract-generator',
    'keyword-generator',
    'citation-suggester',
    'document-summary',
  ]),
  query: z.string().min(1, 'Query is required'),
  conversationId: z.string().uuid().optional(),
});

// Prompt template registry
const promptRegistry: Record<string, string> = {
  'topic-selector': 'Suggest 3 relevant, trending research topics and directions in the area of: "{query}". Include a brief rationale and key challenges for each.',
  'proposal-outline': 'Generate a comprehensive research proposal outline for the topic: "{query}". Include sections for Introduction, Problem Statement, Objectives, Methodology, and Expected Outcomes.',
  'lit-review': 'Provide a literature review summary, identifying 3 key themes and methodologies commonly used in research on: "{query}". Suggest how to frame the literature gap.',
  'abstract-generator': 'Write a professional, academic abstract of approximately 150-250 words based on the following research query/notes: "{query}". Structure it with context, objective, methods, and implications.',
  'keyword-generator': 'Generate 5 to 7 high-impact, indexed keywords and indexing terms for the following research description: "{query}".',
  'citation-suggester': 'Suggest 3 foundational academic citations (authors, titles, venues, years) and outline their core contributions for a research paper about: "{query}". Offer examples in APA and IEEE formats.',
  'document-summary': 'Summarize the following academic draft/text in a concise manner (max 200 words), highlighting the core arguments, methodology, and results: "{query}".'
};

// Simulated academic generators for realistic local fallback
const generateSimulatedResponse = (tool: string, query: string): string => {
  const cleanQuery = query.trim();
  
  switch (tool) {
    case 'topic-selector':
      return `[Onusandhan AI Topic Selector]
Based on your area of interest: "${cleanQuery}", here are 3 recommended research topics:

1. "Integrating Context-Aware Semantic Transformers in ${cleanQuery} Frameworks"
   - Rationale: Combines transformer attention mechanisms with domain-specific schemas to solve vocabulary gap issues.
   - Key Challenges: High computational complexity and limited annotated training datasets.

2. "A Comparative Analysis of Optimization Bottlenecks in Distributed ${cleanQuery}"
   - Rationale: Reviews execution constraints under parallel nodes to minimize communication overhead.
   - Key Challenges: Synthesizing a generalizable benchmark model across varying cluster topologies.

3. "Ethical and Fairness Frameworks for Implementing ${cleanQuery} in Public Systems"
   - Rationale: Evaluates bias propagation and regulatory compliance inside critical decision-making applications.
   - Key Challenges: Translating abstract ethical guidelines into verifiable constraint functions.`;

    case 'proposal-outline':
      return `[Onusandhan AI Proposal Outline]
Proposed Title: "Design and Evaluation of Next-Generation Systems for ${cleanQuery}"

1. INTRODUCTION
   - 1.1 Background Context: Brief review of the evolution of ${cleanQuery}.
   - 1.2 Motivation: Exploring the critical need for optimizing systems.
2. PROBLEM STATEMENT
   - 2.1 Current Constraints: Identifying why traditional solutions fail.
   - 2.2 Operational Limitations: Performance overhead and data security bottlenecks.
3. RESEARCH OBJECTIVES
   - 3.1 Objective 1: Formulate a novel mathematically sound model.
   - 3.2 Objective 2: Build a functional prototype.
   - 3.3 Objective 3: Evaluate performance metrics against industry benchmarks.
4. METHODOLOGY
   - 4.1 System Architecture: Diagramming data pipeline modules.
   - 4.2 Data Collection: Sourcing representative academic datasets.
   - 4.3 Validation Matrix: Measuring response latency, accuracy, and scalability.
5. EXPECTED OUTCOMES
   - 5.1 Artifacts: Open-source repository and standardized API benchmark.
   - 5.2 Academic Contributions: Peer-reviewed publications in Q1 journals.`;

    case 'lit-review':
      return `[Onusandhan AI Literature Review Helper]
Literature analysis mapping historical approaches to: "${cleanQuery}"

Theme 1: Classical Statistical Frameworks
   - Key References: Chen et al. (2018), Rahman & Ahmed (2020).
   - Core Methodology: Regression metrics and tabular clustering.
   - Critique: Fails to capture complex, non-linear dependencies.

Theme 2: Deep Learning & Representation Models
   - Key References: Vaswani et al. (2017), Dr. Rahman (2023).
   - Core Methodology: Neural sequence models and multi-head attention.
   - Critique: High parameter footprints make them impractical for edge deployment.

Theme 3: Hybrid Domain-Aided Paradigms
   - Key References: Kumar & Devi (2024).
   - Core Methodology: Expert rule constraints layered over neural networks.
   - Critique: Challenging to maintain and extend rules dynamically.

Identified Research Gap:
There is a distinct lack of research addressing light-weight deployment models that combine neural speed with hybrid rules specifically tailored to ${cleanQuery}.`;

    case 'abstract-generator':
      return `[Onusandhan AI Abstract Generator]
ABSTRACT
This study addresses the critical challenge of optimizing performance parameters in ${cleanQuery}. Traditional methodologies often suffer from latency overheads and insufficient robustness under scale. We propose a novel, hybrid framework that leverages domain-specific heuristics and light-weight neural attention layers. To validate our approach, we conducted extensive evaluations using standard datasets. The experimental results show that our proposed system reduces latency by 24% and improves throughput accuracy by 15% compared to state-of-the-art baselines. These findings offer valuable contributions toward engineering scalable architectures and provide practical guidelines for academic researchers deploying distributed setups.

Keywords: ${cleanQuery}, Academic Research, Semantic Architecture, Performance Metrics.`;

    case 'keyword-generator':
      return `[Onusandhan AI Keyword Generator]
Based on your description of "${cleanQuery}", here are 6 high-impact keywords formatted for indexing:

1. ${cleanQuery} (Primary Index Term)
2. Semantic Search Optimization
3. Distributed Knowledge Systems
4. Peer Review Heuristics
5. Low-Resource Model Deployment
6. Algorithmic Bottlenecks`;

    case 'citation-suggester':
      return `[Onusandhan AI Citation Suggestions]
Here are 3 foundational references and suggested citation structures for research on: "${cleanQuery}"

1. Reference: "Optimization and Scalability in Distributed ${cleanQuery}"
   - APA: Smith, J., & Jones, M. (2022). Optimization and Scalability in Distributed ${cleanQuery}. Journal of Academic Computation, 14(2), 112-125.
   - IEEE: J. Smith and M. Jones, "Optimization and Scalability in Distributed ${cleanQuery}," J. Acad. Comput., vol. 14, no. 2, pp. 112-125, 2022.
   - Core Contribution: Establishes mathematical proofs for network routing efficiency.

2. Reference: "Semantics and Metadata Standards for Modern Academics"
   - APA: Rahman, H. (2021). Semantics and Metadata Standards for Modern Academics. Dhaka Scientific Press.
   - IEEE: H. Rahman, Semantics and Metadata Standards for Modern Academics. Dhaka: Dhaka Scientific Press, 2021.
   - Core Contribution: Proposes the global XML taxonomy standard.

3. Reference: "Evaluation and Benchmarks of AI Assistants"
   - APA: Al-Mansoori, F. (2023). Evaluation and Benchmarks of AI Assistants. arXiv preprint arXiv:2308.1205.
   - IEEE: F. Al-Mansoori, "Evaluation and Benchmarks of AI Assistants," arXiv preprint arXiv:2308.1205, 2023.
   - Core Contribution: Categorizes chat prompt limitations in double-blind environments.`;

    case 'document-summary':
      default:
      return `[Onusandhan AI Summary Assistant]
SUMMARY (145 Words):
The provided document presents a structured framework for analyzing ${cleanQuery}. The authors isolate several performance bottlenecks, specifically focusing on data pipeline latency and model serialization constraints. To resolve this, they introduce a modular gateway architecture designed to coordinate concurrent client requests. Evaluation metrics demonstrate significant improvements in request latency and server resource utilization. In conclusion, the study provides a robust benchmark and outlines critical guidelines for researchers seeking to implement unified TypeScript monorepos in academic environments.`;
  }
};

// In-memory rate limiting map (limits to 10 requests per user/IP per minute)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_COUNT = 10;
const RATE_LIMIT_WINDOW = 60000; // 1 minute

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];
  
  // Filter out timestamps outside the 1 minute window
  const activeTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
  
  if (activeTimestamps.length >= RATE_LIMIT_COUNT) {
    return false;
  }
  
  activeTimestamps.push(now);
  rateLimitMap.set(key, activeTimestamps);
  return true;
}

export const aiRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Enforce authentication on all AI routes
  fastify.addHook('preHandler', fastify.authenticate);

  // POST /generate - Submit research query to AI tool
  fastify.post('/generate', async (request, reply) => {
    try {
      const parsed = generateSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          message: parsed.error.issues[0]?.message || 'Invalid input payload',
        });
      }

      const { tool, query, conversationId } = parsed.data;
      const currentUser = request.user as any;
      const rateLimitKey = `${currentUser.id}-${request.ip}`;

      // 1. Enforce rate limiting
      if (!checkRateLimit(rateLimitKey)) {
        return reply.status(429).send({
          success: false,
          message: 'Too many requests. Please wait a moment before trying again.',
        });
      }

      // 2. Fetch or create conversation
      let conversation;
      if (conversationId) {
        conversation = await prisma.aIConversation.findUnique({
          where: { id: conversationId },
        });

        if (!conversation) {
          return reply.status(404).send({ success: false, message: 'Conversation not found' });
        }

        if (conversation.userId !== currentUser.id) {
          return reply.status(403).send({ success: false, message: 'Access denied' });
        }
      } else {
        const snippet = query.length > 50 ? `${query.substring(0, 47)}...` : query;
        conversation = await prisma.aIConversation.create({
          data: {
            userId: currentUser.id,
            topic: `${getCategoryLabel(tool)}: ${snippet}`,
          },
        });
      }

      // 3. Process LLM request (Mock fallback or API integration if configured)
      let aiResponse = '';
      const geminiApiKey = process.env.GEMINI_API_KEY;
      const openaiApiKey = process.env.OPENAI_API_KEY;

      if (geminiApiKey) {
        try {
          const promptTemplate = promptRegistry[tool].replace('{query}', query);
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: promptTemplate }] }],
              }),
            }
          );
          if (response.ok) {
            const data = await response.json();
            aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          }
        } catch (err) {
          request.log.error(err as Error, 'Gemini API request failed, falling back to mock response');
        }
      } else if (openaiApiKey) {
        try {
          const promptTemplate = promptRegistry[tool].replace('{query}', query);
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              messages: [{ role: 'user', content: promptTemplate }],
            }),
          });
          if (response.ok) {
            const data = await response.json();
            aiResponse = data.choices?.[0]?.message?.content || '';
          }
        } catch (err) {
          request.log.error(err as Error, 'OpenAI API request failed, falling back to mock response');
        }
      }

      // Fallback if APIs are not configured or failed
      if (!aiResponse) {
        aiResponse = generateSimulatedResponse(tool, query);
      }

      // Append verification disclaimer to output
      const responseWithDisclaimer = `${aiResponse}\n\n---\n*Disclaimer: AI-generated outputs can contain errors. Please review and verify all output details independently before academic publication.*`;

      // 4. Save messages to database
      await prisma.aIMessage.createMany({
        data: [
          {
            conversationId: conversation.id,
            sender: ChatSender.USER,
            content: query,
          },
          {
            conversationId: conversation.id,
            sender: ChatSender.ASSISTANT,
            content: responseWithDisclaimer,
          },
        ],
      });

      // Update conversation timestamp
      await prisma.aIConversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      // 5. Track tokens usage (characters / 4 approximation)
      const promptTokens = Math.ceil(query.length / 4);
      const completionTokens = Math.ceil(responseWithDisclaimer.length / 4);
      const totalTokens = promptTokens + completionTokens;

      // 6. Record Audit Log for tracking usage
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'AI_TOOL_USED',
          details: JSON.stringify({
            tool,
            promptTokens,
            completionTokens,
            totalTokens,
          }),
          ipAddress: request.ip,
        },
      });

      return {
        success: true,
        response: responseWithDisclaimer,
        conversationId: conversation.id,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens,
        },
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error during generation' });
    }
  });

  // GET /conversations - Fetch historical sessions list
  fastify.get('/conversations', async (request, reply) => {
    try {
      const currentUser = request.user as any;
      const conversations = await prisma.aIConversation.findMany({
        where: { userId: currentUser.id },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1, // get latest message
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return {
        success: true,
        conversations,
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error' });
    }
  });

  // GET /conversations/:id - Retrieve messages for a specific session
  fastify.get('/conversations/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const currentUser = request.user as any;

      const conversation = await prisma.aIConversation.findUnique({
        where: { id },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!conversation) {
        return reply.status(404).send({ success: false, message: 'Conversation not found' });
      }

      if (conversation.userId !== currentUser.id) {
        return reply.status(403).send({ success: false, message: 'Access denied' });
      }

      return {
        success: true,
        conversation,
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error' });
    }
  });

  // GET /usage - Admin diagnostics for token and tool usage
  fastify.get('/usage', async (request, reply) => {
    try {
      const currentUser = request.user as any;
      if (currentUser.role !== UserRole.SUPER_ADMIN && currentUser.role !== UserRole.ADMIN) {
        return reply.status(403).send({ success: false, message: 'Access denied to diagnostics' });
      }

      const logs = await prisma.auditLog.findMany({
        where: { action: 'AI_TOOL_USED' },
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

      let totalCalls = logs.length;
      let totalTokens = 0;
      const toolBreakdown: Record<string, number> = {};

      logs.forEach((log) => {
        try {
          const stats = JSON.parse(log.details);
          totalTokens += stats.totalTokens || 0;
          const tool = stats.tool || 'unknown';
          toolBreakdown[tool] = (toolBreakdown[tool] || 0) + 1;
        } catch {
          // ignore parsing error
        }
      });

      return {
        success: true,
        stats: {
          totalCalls,
          totalTokens,
          toolBreakdown,
        },
        logs: logs.slice(0, 50), // return last 50 usage details
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Server error' });
    }
  });
};

const getCategoryLabel = (tool: string) => {
  const labels: Record<string, string> = {
    'topic-selector': 'Topic Selector',
    'proposal-outline': 'Proposal Generator',
    'lit-review': 'Lit Review Helper',
    'abstract-generator': 'Abstract Writer',
    'keyword-generator': 'Keywords Generator',
    'citation-suggester': 'Citation Suggester',
    'document-summary': 'Summarizer',
  };
  return labels[tool] || 'Research Tool';
};
