import { z } from 'zod';

// All configuration comes from environment variables, so the same build runs
// locally, in Docker and in CI. Secrets never live in the code.
const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  // Optional: without it, orders are kept in memory.
  DATABASE_URL: z.string().startsWith('postgres').optional(),
});

export type Config = z.infer<typeof envSchema>;

// Fails fast at startup, listing every invalid variable at once.
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const problems = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`Invalid configuration: ${problems.join('; ')}`);
  }
  return result.data;
}
