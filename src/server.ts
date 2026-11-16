import { existsSync } from 'node:fs';
import pg from 'pg';
import { OrderService } from './application/order-service.js';
import { loadConfig } from './config.js';
import type { OrderRepository } from './domain/order-repository.js';
import { createApp } from './http/app.js';
import { InMemoryOrderRepository } from './infra/in-memory-order-repository.js';
import { createOrdersTable, PostgresOrderRepository } from './infra/postgres-order-repository.js';
import { createLogger } from './logger.js';

// Local development reads .env (never committed); Docker and CI set real env vars.
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const config = loadConfig();
const logger = createLogger(config.LOG_LEVEL);
const repository = await createRepository(config.DATABASE_URL);
const app = createApp(new OrderService(repository), logger);

app.listen(config.PORT, () => {
  logger.info({ port: config.PORT }, 'API listening');
});

async function createRepository(databaseUrl: string | undefined): Promise<OrderRepository> {
  if (!databaseUrl) {
    logger.warn('DATABASE_URL not set: keeping orders in memory');
    return new InMemoryOrderRepository();
  }
  const pool = new pg.Pool({ connectionString: databaseUrl });
  await createOrdersTable(pool);
  logger.info('Using Postgres');
  return new PostgresOrderRepository(pool);
}
