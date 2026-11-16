import type { RequestHandler } from 'express';
import { collectDefaultMetrics, Histogram, Registry } from 'prom-client';

// Buckets in seconds. 0.2 is there on purpose: it is the SLO threshold
// (95% of requests under 200 ms), so the histogram can answer it exactly.
const LATENCY_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.2, 0.5, 1, 2.5];

export interface Metrics {
  registry: Registry;
  // Measures every request that goes through it.
  middleware: RequestHandler;
}

// One registry per app (not the global one), so tests can build several apps
// without metric name collisions.
export function createMetrics(): Metrics {
  const registry = new Registry();
  collectDefaultMetrics({ register: registry });

  const httpDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request latency in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: LATENCY_BUCKETS,
    registers: [registry],
  });

  const middleware: RequestHandler = (req, res, next) => {
    const stopTimer = httpDuration.startTimer();
    res.on('finish', () => {
      // Uses the route pattern ("/orders/:id"), not the real URL, so ids do not
      // create one time series per order. Requests that matched no route share one label.
      const route = req.route ? `${req.baseUrl}${req.route.path}` : 'unmatched';
      stopTimer({ method: req.method, route, status_code: res.statusCode });
    });
    next();
  };

  return { registry, middleware };
}
