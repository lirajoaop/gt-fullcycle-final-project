**Nível: Projeto B (simples)**

# API de Pedidos

Projeto final do curso Full Cycle (Módulo 4). Uma API REST de um domínio só, pedidos, com um fluxo principal funcionando de ponta a ponta: criar um pedido, consultar, pagar, enviar ou cancelar.

> Em construção. As seções "Como subir" e "Como testar" entram junto com o código.

## Integrantes

| Nome | Módulo |
|---|---|
| João Pedro Lira | Pedidos: criação e consulta |
| Leandro Frota | Pedidos: pagamento, envio e cancelamento |

Quem fez o quê está em [CONTRIBUTORS.md](CONTRIBUTORS.md).

## Escopo

| Endpoint | O que faz |
|---|---|
| `POST /orders` | Cria um pedido (cliente + itens) |
| `GET /orders/:id` | Consulta um pedido |
| `POST /orders/:id/pay` | Paga um pedido pendente |
| `POST /orders/:id/ship` | Envia um pedido pago |
| `POST /orders/:id/cancel` | Cancela um pedido pendente |
| `GET /health` | Saúde da API |
| `GET /metrics` | Métricas no formato Prometheus |

Status do pedido: `pending` → `paid` → `shipped`, ou `pending` → `cancelled`.

## Stack

Node.js 24 + TypeScript · Express · PostgreSQL · Vitest + Supertest · pino · prom-client · k6 · Docker Compose · GitHub Actions

## Observabilidade e SLO

A API expõe `GET /metrics` no formato Prometheus. A métrica principal é o histograma `http_request_duration_seconds`, com os labels `method`, `route` (o padrão da rota, como `/orders/:id`) e `status_code`. Os buckets incluem 0,2 s, o limite do SLO.

### SLO (objetivo de nível de serviço)

| Indicador | Objetivo | Janela |
|---|---|---|
| Latência | 95% das requisições em menos de 200 ms (p95 < 200 ms) | 30 dias |
| Erros | menos de 1% das requisições com resposta 5xx | 30 dias |

Respostas 4xx (corpo inválido, pedido inexistente, transição inválida) são erros do cliente e **não** contam como falha do serviço.

### Como medir

Consultas PromQL sobre o histograma:

```promql
# p95 de latência nos últimos 5 minutos
histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))

# fração de requisições mais rápidas que 200 ms (deve ficar acima de 0,95)
sum(rate(http_request_duration_seconds_bucket{le="0.2"}[5m])) / sum(rate(http_request_duration_seconds_count[5m]))

# taxa de erro 5xx (deve ficar abaixo de 0,01)
sum(rate(http_request_duration_seconds_count{status_code=~"5.."}[5m])) / sum(rate(http_request_duration_seconds_count[5m]))
```

O smoke test do k6 (`tests/k6/smoke.js`) usa os mesmos limites como thresholds, e os números medidos ficam em [docs/desempenho.md](docs/desempenho.md).
