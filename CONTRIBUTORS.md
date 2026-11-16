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

- Máquina de estados do pedido
- `POST /orders/:id/pay`, `/ship` e `/cancel`
- Dockerfile e Docker Compose (API + Postgres)
- Pipeline de CI no GitHub Actions
- Métrica de latência em `/metrics` e SLO
- Testes unitários das transições e teste de integração do fluxo de status
- ADR 0001, smoke test k6 e `docs/desempenho.md`

## Uso de IA

Cada um declara em `docs/ia.md` os prompts que importaram.

> Esta é a divisão combinada no início. No fechamento, cada um atualiza a própria seção com o que realmente entregou.
