import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root context if not already loaded
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '..', '..', '.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string({ required_error: 'DATABASE_URL environment variable is required' }).url(),
  REDIS_URL: z.string({ required_error: 'REDIS_URL environment variable is required' }).url(),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  JWT_SECRET: z.string({ required_error: 'JWT_SECRET environment variable is required' }).min(12, 'JWT_SECRET must be at least 12 characters'),
  PAYMENT_PROVIDER: z.enum(['sandbox', 'stripe', 'razorpay']).default('sandbox'),
  SANDBOX_WEBHOOK_SECRET: z.string().default('sandbox_secret_key_123!'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
});

const parseEnv = () => {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('❌ Environment validation failed:');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    process.exit(1);
  }
  
  return parsed.data;
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
