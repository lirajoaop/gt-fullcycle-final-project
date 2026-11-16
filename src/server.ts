import { existsSync } from 'node:fs';
import pg from 'pg';
import { OrderService } from './application/order-service.js';
import { loadConfig } from './config.js';
import type { OrderRepository } from './domain/order-repository.js';
import { createApp } from './http/app.js';
import { InMemoryOrderRepository } from './infra/in-memory-order-repository.js';
import { createOrdersTable, PostgresOrderRepository } from './infra/postgres-order-repository.js';

// Local development reads .env (never committed); Docker and CI set real env vars.
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const config = loadConfig();
const repository = await createRepository(config.DATABASE_URL);
const app = createApp(new OrderService(repository));

app.listen(config.PORT, () => {
  console.log(`API listening on http://localhost:${config.PORT}`);
});

async function createRepository(databaseUrl: string | undefined): Promise<OrderRepository> {
  if (!databaseUrl) {
    console.log('DATABASE_URL not set: keeping orders in memory');
    return new InMemoryOrderRepository();
  }
  const pool = new pg.Pool({ connectionString: databaseUrl });
  await createOrdersTable(pool);
  return new PostgresOrderRepository(pool);
}
