import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  FRONTEND_URL: z.string().startsWith('http', "FRONTEND_URL must start with http or https").default('http://localhost:5173'),
  
  // FIXED: Changed from .url() to .startsWith()
  MONGO_URI: z.string().startsWith('mongodb', "MONGO_URI must be a valid mongodb connection string"),
  RABBITMQ_URI: z.string().startsWith('amqp', "RABBITMQ_URI must start with amqp").optional(), 
  
  SMTP_USER: z.string().email("SMTP_USER must be a valid email").optional(),
  SMTP_PASS: z.string().min(1, "SMTP_PASS is required").optional(),
  JWT_SECRET: z.string().min(10, "JWT_SECRET must be at least 10 characters"),
  AI_PROVIDER_KEY: z.string().min(1).optional(),
  
  // Made optional for now so your app doesn't crash before Milestone 4
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "Cloudinary name required").optional(),
  CLOUDINARY_API_KEY: z.string().min(1, "Cloudinary API key required").optional(),
  CLOUDINARY_API_SECRET: z.string().min(1, "Cloudinary API secret required").optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('Invalid environment variables:\n', _env.error.format());
  process.exit(1);
}

export const config = _env.data;