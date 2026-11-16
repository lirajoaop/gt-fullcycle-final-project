import type { Pool } from 'pg';
import type { Order, OrderItem, OrderStatus } from '../domain/order.js';
import type { OrderRepository } from '../domain/order-repository.js';

// Idempotent: safe to run every time the API starts.
const CREATE_ORDERS_TABLE = `
  CREATE TABLE IF NOT EXISTS orders (
    id            UUID        PRIMARY KEY,
    customer_name TEXT        NOT NULL,
    items         JSONB       NOT NULL,
    total_cents   INTEGER     NOT NULL CHECK (total_cents >= 0),
    status        TEXT        NOT NULL CHECK (status IN ('pending', 'paid', 'shipped', 'cancelled')),
    created_at    TIMESTAMPTZ NOT NULL,
    updated_at    TIMESTAMPTZ NOT NULL
  )
`;

const COLUMNS = 'id, customer_name, items, total_cents, status, created_at, updated_at';

// Shape of a row as the pg driver returns it: JSONB comes back parsed and
// TIMESTAMPTZ comes back as Date.
interface OrderRow {
  id: string;
  customer_name: string;
  items: OrderItem[];
  total_cents: number;
  status: OrderStatus;
  created_at: Date;
  updated_at: Date;
}

export async function createOrdersTable(pool: Pool): Promise<void> {
  await pool.query(CREATE_ORDERS_TABLE);
}

export class PostgresOrderRepository implements OrderRepository {
  constructor(private readonly pool: Pool) {}

  async insert(order: Order): Promise<void> {
    await this.pool.query(`INSERT INTO orders (${COLUMNS}) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
      order.id,
      order.customerName,
      JSON.stringify(order.items),
      order.totalCents,
      order.status,
      order.createdAt,
      order.updatedAt,
    ]);
  }

  async findById(id: string): Promise<Order | null> {
    const { rows } = await this.pool.query<OrderRow>(`SELECT ${COLUMNS} FROM orders WHERE id = $1`, [id]);
    return rows[0] ? toOrder(rows[0]) : null;
  }

  async updateStatus(id: string, status: OrderStatus, updatedAt: Date): Promise<void> {
    const result = await this.pool.query('UPDATE orders SET status = $2, updated_at = $3 WHERE id = $1', [
      id,
      status,
      updatedAt,
    ]);
    if (result.rowCount === 0) {
      throw new Error(`Order ${id} does not exist`);
    }
  }
}

// Maps the snake_case columns to the camelCase domain object.
function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    customerName: row.customer_name,
    items: row.items,
    totalCents: row.total_cents,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
