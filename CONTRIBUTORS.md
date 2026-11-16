# Contribuidores

Projeto em dupla, dividido por **módulo do sistema**. Cada pessoa commita a própria parte, com a própria conta, e os PRs de um são revisados pelo outro.

## João Pedro Lira — Pedidos: criação e consulta

O que entreguei (atualizado no fechamento):

| Entrega | Arquivos | PR |
|---|---|---|
| Base do projeto: Node + TypeScript, ESLint, Vitest, README inicial | `package.json`, `tsconfig.json`, `eslint.config.js`, `vitest.config.ts` | direto na `main` |
| Entidade Pedido e regras de criação (RN01–RN07, RN10) + testes unitários | `src/domain/order.ts`, `tests/unit/order.test.ts` | #2 |
| Padrão Repository (interface + memória), `OrderService`, `POST /orders`, `GET /orders/:id`, `GET /health`, testes de integração com Supertest, mensagens da API em inglês | `src/domain/order-repository.ts`, `src/infra/in-memory-order-repository.ts`, `src/application/order-service.ts`, `src/http/app.ts`, `tests/integration/orders-api.test.ts` | #3 |
| Repositório Postgres, configuração por variável de ambiente e `.env.example`, logs estruturados com pino e `x-request-id` | `src/infra/postgres-order-repository.ts`, `src/config.ts`, `src/logger.ts`, `src/server.ts`, testes correspondentes | #5 |
| Coverage mínimo de 80%, OpenAPI do endpoint principal (lint com Spectral), README do primeiro dia, `docs/ia.md` | `vitest.config.ts`, `docs/openapi.yaml`, `.spectral.yaml`, `README.md`, `docs/ia.md` | #8 |

Também revisei e aprovei os PRs do Leandro #1, #4 (antes, pedi mudanças para as mensagens em inglês) e #6, e fiz o merge do #7.

## Leandro Frota — Pedidos: pagamento, envio e cancelamento

O que entreguei (atualizado no fechamento):

| Entrega | Arquivos | PR |
|---|---|---|
| Pipeline de CI no GitHub Actions (L1) e Docker Compose com Postgres (L2) | `.github/workflows/ci.yml`, `docker-compose.yml` | #1 |
| Máquina de estados do pedido (L3), testes unitários das transições (L4) e ADR 0001 (L5) | `src/domain/order-status.ts`, `tests/unit/order-status.test.ts`, `docs/adr/0001-maquina-de-estados.md` | #4 |
| Dockerfile da API e serviço `api` no compose (L6), `POST /orders/:id/pay`, `/ship` e `/cancel` com `updateStatus` no repositório (L7) e teste de integração do fluxo de status (L8) | `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `src/application/order-service.ts`, `src/http/app.ts`, `src/infra/*-order-repository.ts`, `tests/integration/order-status-flow.test.ts` | #6 |
| Métrica de latência em `/metrics` (L9), SLO no README (L10), smoke test k6 (L11) e `docs/desempenho.md` com p95 medido (L12) | `src/metrics.ts`, `tests/integration/metrics.test.ts`, `tests/k6/smoke.js`, `docs/desempenho.md`, seção "Observabilidade" do `README.md` | #9 |
| Coverage e build no pipeline (L13) e minha parte em `docs/ia.md` e `CONTRIBUTORS.md` (L14) | `.github/workflows/ci.yml`, seção "CI" do `README.md`, `docs/ia.md`, `CONTRIBUTORS.md` | a abrir |

Para implementar o `updateStatus` (L7) acrescentei 2 testes ao arquivo do João `tests/integration/postgres-order-repository.test.ts`. Os PRs #1, #4 e #6 foram revisados pelo João.

## Uso de IA

Cada um declara em `docs/ia.md` os prompts que importaram.

> Esta é a divisão combinada no início. No fechamento, cada um atualiza a própria seção com o que realmente entregou.
