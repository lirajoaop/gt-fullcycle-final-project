import http from 'k6/http';
import { check } from 'k6';

// Smoke test: a light, short run of the main flow against a running API.
// Thresholds are the SLO from the README: p95 < 200 ms and < 1% failed requests.
// Run (API from docker compose):
//   docker run --rm -i --network <compose-project>_default -e BASE_URL=http://api:3000 \
//     grafana/k6 run - < tests/k6/smoke.js
export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const JSON_HEADERS = { headers: { 'Content-Type': 'application/json' } };

export default function () {
  const body = JSON.stringify({
    customerName: 'Load Test',
    items: [{ sku: 'CAFE-500G', quantity: 2, unitPriceCents: 3490 }],
  });

  const created = http.post(`${BASE_URL}/orders`, body, JSON_HEADERS);
  check(created, { 'create returns 201': (r) => r.status === 201 });
  const id = created.json('id');

  const fetched = http.get(`${BASE_URL}/orders/${id}`);
  check(fetched, { 'get returns 200': (r) => r.status === 200 });

  const paid = http.post(`${BASE_URL}/orders/${id}/pay`);
  check(paid, { 'pay returns paid': (r) => r.status === 200 && r.json('status') === 'paid' });

  const shipped = http.post(`${BASE_URL}/orders/${id}/ship`);
  check(shipped, { 'ship returns shipped': (r) => r.status === 200 && r.json('status') === 'shipped' });
}
