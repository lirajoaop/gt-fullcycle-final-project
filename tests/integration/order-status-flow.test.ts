import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { OrderService } from '../../src/application/order-service.js';
import { createApp } from '../../src/http/app.js';
import { InMemoryOrderRepository } from '../../src/infra/in-memory-order-repository.js';
import { createLogger } from '../../src/logger.js';

// A valid UUID that is never generated, so it never matches a saved order.
const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

const validBody = {
  customerName: 'Ana Souza',
  items: [{ sku: 'CAFE-500G', quantity: 2, unitPriceCents: 3490 }],
};

// Integration test of the status flow: HTTP -> service -> state machine -> repository.
describe('Order status flow', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp(new OrderService(new InMemoryOrderRepository()), createLogger('silent'));
  });

  async function createPendingOrder(): Promise<string> {
    const response = await request(app).post('/orders').send(validBody);
    expect(response.status).toBe(201);
    return response.body.id;
  }

  it('creates, pays and ships an order', async () => {
    const id = await createPendingOrder();

    const paid = await request(app).post(`/orders/${id}/pay`);
    expect(paid.status).toBe(200);
    expect(paid.body.status).toBe('paid');

    const shipped = await request(app).post(`/orders/${id}/ship`);
    expect(shipped.status).toBe(200);
    expect(shipped.body.status).toBe('shipped');

    const fetched = await request(app).get(`/orders/${id}`);
    expect(fetched.body.status).toBe('shipped');
  });

  it('updates updatedAt on a status change and keeps createdAt', async () => {
    const id = await createPendingOrder();
    const before = (await request(app).get(`/orders/${id}`)).body;

    const paid = await request(app).post(`/orders/${id}/pay`);

    expect(paid.body.createdAt).toBe(before.createdAt);
    expect(new Date(paid.body.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(before.updatedAt).getTime(),
    );
  });

  it('cancels a pending order', async () => {
    const id = await createPendingOrder();

    const cancelled = await request(app).post(`/orders/${id}/cancel`);

    expect(cancelled.status).toBe(200);
    expect(cancelled.body.status).toBe('cancelled');
    expect((await request(app).get(`/orders/${id}`)).body.status).toBe('cancelled');
  });

  it('returns 409 when cancelling a shipped order', async () => {
    const id = await createPendingOrder();
    await request(app).post(`/orders/${id}/pay`);
    await request(app).post(`/orders/${id}/ship`);

    const response = await request(app).post(`/orders/${id}/cancel`);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('INVALID_TRANSITION');
    expect((await request(app).get(`/orders/${id}`)).body.status).toBe('shipped');
  });

  it('returns 409 when shipping an order that was not paid', async () => {
    const id = await createPendingOrder();

    const response = await request(app).post(`/orders/${id}/ship`);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('INVALID_TRANSITION');
    expect((await request(app).get(`/orders/${id}`)).body.status).toBe('pending');
  });

  it('returns 409 when paying the same order twice', async () => {
    const id = await createPendingOrder();
    await request(app).post(`/orders/${id}/pay`);

    const response = await request(app).post(`/orders/${id}/pay`);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('INVALID_TRANSITION');
  });

  it.each(['pay', 'ship', 'cancel'])('returns 404 on %s for an unknown order', async (action) => {
    const response = await request(app).post(`/orders/${UNKNOWN_ID}/${action}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('ORDER_NOT_FOUND');
  });
});
