import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { OrderService } from '../../src/application/order-service.js';
import { createApp } from '../../src/http/app.js';
import { InMemoryOrderRepository } from '../../src/infra/in-memory-order-repository.js';
import { createLogger } from '../../src/logger.js';

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

const validBody = {
  customerName: 'Ana Souza',
  items: [{ sku: 'CAFE-500G', quantity: 1, unitPriceCents: 3490 }],
};

describe('GET /metrics', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp(new OrderService(new InMemoryOrderRepository()), createLogger('silent'));
  });

  it('exposes Prometheus metrics in text format', async () => {
    const response = await request(app).get('/metrics');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.text).toContain('# TYPE http_request_duration_seconds histogram');
    expect(response.text).toContain('process_cpu_user_seconds_total');
  });

  it('counts a request in the latency histogram with method, route and status', async () => {
    const created = await request(app).post('/orders').send(validBody);

    const metrics = (await request(app).get('/metrics')).text;

    expect(created.status).toBe(201);
    expect(metrics).toContain(
      'http_request_duration_seconds_count{method="POST",route="/orders",status_code="201"} 1',
    );
  });

  it('uses the route pattern instead of the real id', async () => {
    await request(app).get(`/orders/${UNKNOWN_ID}`);

    const metrics = (await request(app).get('/metrics')).text;

    expect(metrics).toContain(
      'http_request_duration_seconds_count{method="GET",route="/orders/:id",status_code="404"} 1',
    );
    expect(metrics).not.toContain(UNKNOWN_ID);
  });

  it('records error responses with their status code', async () => {
    await request(app).post('/orders').send({ customerName: '', items: [] });

    const metrics = (await request(app).get('/metrics')).text;

    expect(metrics).toContain(
      'http_request_duration_seconds_count{method="POST",route="/orders",status_code="400"} 1',
    );
  });

  it('has a bucket at 0.2 seconds, the SLO threshold', async () => {
    await request(app).get('/health');

    const metrics = (await request(app).get('/metrics')).text;

    expect(metrics).toMatch(/http_request_duration_seconds_bucket\{le="0\.2",method="GET",route="\/health"/);
  });
});
