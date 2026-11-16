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

> Subir a API também pelo Docker Compose, com um único comando, entra com o Dockerfile (L6, Leandro).

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

Os endpoints de status (`pay`, `ship`, `cancel`) entram no L7 (Leandro). Todo erro segue o formato `{ "error": { "code", "message", "details"? } }`. O contrato completo do endpoint principal está em [docs/openapi.yaml](docs/openapi.yaml); para ver navegável, cole o arquivo em [editor.swagger.io](https://editor.swagger.io).

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

> Métrica, SLO e o teste de carga com k6 entram nos itens L9–L12 (Leandro).

## CI

O GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)) roda em todo PR e em todo push na `main`: instala as dependências, roda o lint e os testes. O merge só acontece com o CI verde.

## Documentação

- [docs/openapi.yaml](docs/openapi.yaml): contrato da API (OpenAPI 3.1)
- [docs/adr/0001-maquina-de-estados.md](docs/adr/0001-maquina-de-estados.md): decisão sobre a máquina de estados
- [CONTRIBUTORS.md](CONTRIBUTORS.md): quem fez o quê
