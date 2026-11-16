**Nível: Projeto B (simples)**

# API de Pedidos

Projeto final do curso Full Cycle (Módulo 4). Uma API REST de um domínio só, pedidos, com um fluxo principal funcionando de ponta a ponta: criar um pedido, consultar, pagar, enviar ou cancelar.

## Integrantes

| Nome | Módulo |
|---|---|
| João Pedro Lira | Pedidos: criação e consulta |
| Leandro Frota | Pedidos: pagamento, envio e cancelamento |

Quem fez o quê está em [CONTRIBUTORS.md](CONTRIBUTORS.md).

## Como subir

Requisitos: **Node 24** (veja `.nvmrc`) e **Docker**.

```bash
cp .env.example .env          # variáveis locais (o .env não vai para o Git)
npm ci                        # instala as dependências
docker compose up -d db       # sobe o Postgres
npm run dev                   # API em http://localhost:3000
```

Sem `DATABASE_URL` no `.env`, a API sobe com os pedidos **em memória** (somem ao reiniciar). Com o Postgres, eles ficam salvos.

### Tudo pelo Docker Compose (um comando)

Sobe a API e o Postgres juntos, sem precisar do Node local:

```bash
docker compose up --build        # API em http://localhost:3000
# se a porta 3000 estiver ocupada: API_PORT=3001 docker compose up --build
docker compose down              # para tudo
```

Neste modo a API usa o Postgres do compose (`DATABASE_URL` já vem configurada) e roda com usuário não-root.

### Testando na mão

```bash
# cria um pedido
curl -X POST http://localhost:3000/orders \
  -H 'content-type: application/json' \
  -d '{"customerName":"Ana Souza","items":[{"sku":"CAFE-500G","quantity":2,"unitPriceCents":3490}]}'

# consulta (troque <id> pelo id devolvido acima)
curl http://localhost:3000/orders/<id>
```

## Como testar

```bash
npm test                 # testes unitários e de integração
npm run test:coverage    # testes + cobertura (mínimo de 80%)
npm run lint             # ESLint
npm run lint:openapi     # valida docs/openapi.yaml com o Spectral
npm run typecheck        # checagem de tipos do TypeScript
```

Os testes do repositório Postgres só rodam quando existe `DATABASE_URL`; sem ela, são pulados. Para rodar todos:

```bash
docker compose up -d db
DATABASE_URL=postgres://pedidos:pedidos_dev@localhost:5432/pedidos npm test
```

**Coverage mínimo declarado: 80%** de linhas, statements, funções e branches (`vitest.config.ts`). O `npm run test:coverage` falha se cair abaixo disso.

## Configuração

Toda a configuração vem de variáveis de ambiente. O modelo está em [.env.example](.env.example).

| Variável | Padrão | Para que serve |
|---|---|---|
| `PORT` | `3000` | Porta HTTP |
| `LOG_LEVEL` | `info` | Nível dos logs (`fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent`) |
| `DATABASE_URL` | vazio | Conexão com o Postgres. Vazio = pedidos em memória |

A API valida as variáveis na subida e **não sobe** se alguma estiver inválida, listando todos os problemas.

## Endpoints

| Método e rota | Sucesso | Erros |
|---|---|---|
| `POST /orders` | 201 com o pedido criado (`pending`) | 400 `INVALID_ORDER` |
| `GET /orders/:id` | 200 com o pedido | 404 `ORDER_NOT_FOUND` |
| `POST /orders/:id/pay` | 200 com o pedido `paid` | 404, 409 `INVALID_TRANSITION` |
| `POST /orders/:id/ship` | 200 com o pedido `shipped` | 404, 409 `INVALID_TRANSITION` |
| `POST /orders/:id/cancel` | 200 com o pedido `cancelled` | 404, 409 `INVALID_TRANSITION` |
| `GET /health` | 200 `{"status":"ok"}` | — |
| `GET /metrics` | 200 com as métricas em texto (Prometheus) | — |

Todo erro segue o formato `{ "error": { "code", "message", "details"? } }`. O contrato completo do endpoint principal está em [docs/openapi.yaml](docs/openapi.yaml); para ver navegável, cole o arquivo em [editor.swagger.io](https://editor.swagger.io).

Valores em dinheiro são sempre **inteiros em centavos** (`unitPriceCents`, `totalCents`), para evitar erro de arredondamento.

## Arquitetura

```
src/
├─ domain/          regras de negócio, sem HTTP e sem banco
│  ├─ order.ts            entidade Pedido e regras de criação
│  ├─ order-status.ts     máquina de estados (pay, ship, cancel)
│  └─ order-repository.ts interface do repositório
├─ application/     casos de uso
│  └─ order-service.ts
├─ infra/           implementações do repositório
│  ├─ in-memory-order-repository.ts
│  └─ postgres-order-repository.ts
├─ http/            Express: rotas, validação do formato e tradução de erros
│  └─ app.ts
├─ config.ts        variáveis de ambiente validadas
├─ logger.ts        logs estruturados (pino)
└─ server.ts        liga as peças e abre a porta
```

### Padrão de projeto: Repository

O `OrderService` e a API dependem só da **interface** `OrderRepository`, nunca de um banco específico. Existem duas implementações: **em memória**, usada nos testes e quando não há banco, e **Postgres**. A troca acontece em um único lugar (`server.ts`), sem mudar o serviço nem as rotas.

Por que esse padrão neste projeto: os testes de integração da API rodam em milissegundos, sem Docker, porque usam o repositório em memória; e a mesma regra de negócio vale com qualquer banco.

### SOLID na prática

- **S (responsabilidade única):** cada camada faz uma coisa. O zod valida o **formato** do JSON na camada HTTP; as **regras de negócio** ficam no domínio (`createOrder`); o serviço orquestra; o repositório persiste.
- **O (aberto/fechado):** um banco novo é uma nova classe que implementa `OrderRepository`, sem mexer no que já existe.
- **D (inversão de dependência):** o serviço recebe o repositório pelo construtor e depende da abstração, não do Postgres.

A decisão sobre onde ficam as regras de status está no [ADR 0001](docs/adr/0001-maquina-de-estados.md).

## Observabilidade

- **Logs estruturados** com pino: uma linha JSON por requisição (método, rota, status, tempo de resposta). O nível segue o status: `info` para 2xx, `warn` para 4xx, `error` para 5xx.
- **`x-request-id`:** cada requisição ganha um id, devolvido no header da resposta, para seguir a mesma requisição nos logs. Se quem chamou já mandar um, ele é reaproveitado.
- Erros inesperados vão para o log com o stack trace; quem chamou recebe só uma mensagem genérica.
- Para ler os logs formatados em desenvolvimento: `npm run dev | npx pino-pretty`.

### Métrica de latência

`GET /metrics` expõe as métricas no formato Prometheus. A principal é o histograma `http_request_duration_seconds`, com os labels `method`, `route` (o padrão da rota, como `/orders/:id`, e não a URL real) e `status_code`. Os buckets incluem 0,2 s, o limite do SLO.

### SLO (objetivo de nível de serviço)

| Indicador | Objetivo | Janela |
|---|---|---|
| Latência | 95% das requisições em menos de 200 ms (p95 < 200 ms) | 30 dias |
| Erros | menos de 1% das requisições com resposta 5xx | 30 dias |

Respostas 4xx (corpo inválido, pedido inexistente, transição inválida) são erros do cliente e **não** contam como falha do serviço.

Consultas PromQL para medir:

```promql
# p95 de latência nos últimos 5 minutos
histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))

# fração de requisições mais rápidas que 200 ms (deve ficar acima de 0,95)
sum(rate(http_request_duration_seconds_bucket{le="0.2"}[5m])) / sum(rate(http_request_duration_seconds_count[5m]))

# taxa de erro 5xx (deve ficar abaixo de 0,01)
sum(rate(http_request_duration_seconds_count{status_code=~"5.."}[5m])) / sum(rate(http_request_duration_seconds_count[5m]))
```

O smoke test do k6 ([tests/k6/smoke.js](tests/k6/smoke.js)) usa os mesmos limites como thresholds, e os números medidos ficam em [docs/desempenho.md](docs/desempenho.md).

## CI

O GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)) roda em todo PR e em todo push na `main`: instala as dependências, roda o lint, os testes com cobertura e o build. O CI **falha se a cobertura cair abaixo do mínimo de 80%** (`vitest.config.ts`) ou se o TypeScript não compilar. O merge só acontece com o CI verde.

## Documentação

- [docs/openapi.yaml](docs/openapi.yaml): contrato da API (OpenAPI 3.1)
- [docs/adr/0001-maquina-de-estados.md](docs/adr/0001-maquina-de-estados.md): decisão sobre a máquina de estados
- [CONTRIBUTORS.md](CONTRIBUTORS.md): quem fez o quê
