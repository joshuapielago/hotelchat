import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3100),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  ANTHROPIC_API_KEY: z.string(),
  CHATWOOT_BASE_URL: z.string(),
  CHATWOOT_BOT_TOKEN: z.string(),
  CHATWOOT_ACCOUNT_ID: z.coerce.number(),
  MAX_MESSAGES_PER_MINUTE: z.coerce.number().default(20),
  AI_CONFIDENCE_THRESHOLD: z.coerce.number().default(0.7),
});

export type Config = z.infer<typeof envSchema>;

let _config: Config | null = null;

export function getConfig(): Config {
  if (!_config) {
    _config = envSchema.parse(process.env);
  }
  return _config;
}
