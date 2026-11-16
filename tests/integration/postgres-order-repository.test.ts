import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createOrder } from '../../src/domain/order.js';
import { createOrdersTable, PostgresOrderRepository } from '../../src/infra/postgres-order-repository.js';

const DATABASE_URL = process.env.DATABASE_URL;
const NOW = new Date('2026-11-16T12:00:00.000Z');

function newOrder() {
  return createOrder(
    {
      customerName: 'Ana Souza',
      items: [
        { sku: 'CAFE-500G', quantity: 2, unitPriceCents: 3490 },
        { sku: 'FILTRO-103', quantity: 1, unitPriceCents: 1250 },
      ],
    },
    randomUUID(),
    NOW,
  );
}

// Runs against a real Postgres. Locally: `docker compose up -d db` and set DATABASE_URL.
// Skipped when DATABASE_URL is not set, so the CI stays green until it gets a Postgres service.
describe.skipIf(!DATABASE_URL)('PostgresOrderRepository', () => {
  let pool: pg.Pool;
  let repository: PostgresOrderRepository;

  beforeAll(async () => {
    pool = new pg.Pool({ connectionString: DATABASE_URL });
    await createOrdersTable(pool);
    await createOrdersTable(pool); // running twice must not fail
    repository = new PostgresOrderRepository(pool);
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE orders');
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('saves an order and reads it back unchanged', async () => {
    const order = newOrder();

    await repository.insert(order);

    expect(await repository.findById(order.id)).toEqual(order);
  });

  it('returns null for an order that does not exist', async () => {
    expect(await repository.findById(randomUUID())).toBeNull();
  });

  it('updates the status and updatedAt of an order', async () => {
    const order = newOrder();
    await repository.insert(order);
    const later = new Date('2026-11-16T13:00:00.000Z');

    await repository.updateStatus(order.id, 'paid', later);

    expect(await repository.findById(order.id)).toEqual({ ...order, status: 'paid', updatedAt: later });
  });

  it('rejects updating the status of an order that does not exist', async () => {
    await expect(repository.updateStatus(randomUUID(), 'paid', NOW)).rejects.toThrow(/does not exist/);
  });

  it('rejects inserting the same id twice', async () => {
    const order = newOrder();
    await repository.insert(order);

    await expect(repository.insert(order)).rejects.toThrow(/duplicate key/);
  });
});
