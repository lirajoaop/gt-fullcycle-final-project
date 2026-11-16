# Desempenho

Medições feitas com o k6 sobre a API rodando no Docker Compose (API + PostgreSQL), em 16/11/2026. Todos os números abaixo foram obtidos nessas execuções, sem estimativas.

## O que foi medido

O script [tests/k6/smoke.js](../tests/k6/smoke.js) repete o fluxo principal: `POST /orders` → `GET /orders/:id` → `POST /orders/:id/pay` → `POST /orders/:id/ship`. Cada iteração faz 4 requisições, e todas devem responder com sucesso (2xx).

Thresholds do smoke test, iguais ao SLO do [README](../README.md#observabilidade-e-slo):

- `p(95) < 200 ms`
- menos de 1% de requisições com falha
- mais de 99% dos checks passando

## Ambiente

| Item | Valor |
|---|---|
| Máquina | Intel Core i7-10510U (8 CPUs lógicas), 6 GB de memória disponíveis para o Docker |
| Sistema | Windows 11, Docker Desktop (Docker 29.8.0) |
| API | Node 24, 1 processo, imagem `node:24-alpine` |
| Banco | PostgreSQL 17 (`postgres:17-alpine`), no mesmo compose |
| k6 | v2.4.0, rodando em container na rede do compose (`http://api:3000`) |

Tudo roda na **mesma máquina**: API, banco e gerador de carga disputam a mesma CPU.

## Como reproduzir

```bash
API_PORT=3001 docker compose up --build -d
docker run --rm -i --network gt-fullcycle-final-project_default -e BASE_URL=http://api:3000 \
  grafana/k6 run - < tests/k6/smoke.js
# carga maior: acrescente, por exemplo, --vus 100 --duration 30s ao comando do k6
docker compose down
```

## Resultado do smoke test (5 usuários virtuais, 30 s)

Três rodadas seguidas, com o mesmo ambiente:

| Rodada | p95 | p90 | média | máximo | req/s | requisições | falhas |
|---|---|---|---|---|---|---|---|
| 1 | 6,49 ms | 5,42 ms | 3,83 ms | 174,8 ms | 1.252 | 37.564 | 0,00% |
| 2 | 7,23 ms | 6,25 ms | 4,23 ms | 125,5 ms | 1.127 | 33.816 | 0,00% |
| 3 | 5,73 ms | 5,02 ms | 3,71 ms | 437,1 ms | 1.278 | 38.348 | 0,00% |

**p95 medido: entre 5,73 ms e 7,23 ms.** Os thresholds passaram nas três rodadas, com folga: o SLO é de 200 ms. Nenhuma requisição falhou e 100% dos checks passaram (a rodada 1 teve 37.564 de 37.564).

## Carga maior (fora do smoke test)

Para saber onde a latência começa a subir, o mesmo script rodou com mais usuários, por 30 s:

| Usuários virtuais | p95 | média | máximo | req/s | falhas | threshold p95 < 200 ms |
|---|---|---|---|---|---|---|
| 5 (smoke) | 5,73 a 7,23 ms | ~4 ms | até 437 ms | ~1.130 a 1.280 | 0,00% | passou |
| 20 | 29,4 ms | 15,9 ms | 247 ms | 1.240 | 0,00% | passou |
| 100 | 121,9 ms | 71,0 ms | 973 ms | 1.398 | 0,00% | passou |
| 300 | **441,4 ms** | 221,8 ms | 2.240 ms | 1.346 | 0,00% | **falhou** |

Com 300 usuários simultâneos o p95 passou de 200 ms e o k6 terminou com threshold violado. Mesmo assim, nenhuma requisição devolveu erro: a API ficou mais lenta, mas não quebrou.

## O que limitou

A **vazão ficou praticamente estável em 1.100 a 1.400 req/s** em todas as cargas, de 5 a 300 usuários. Como a vazão não cresce, usuários a mais só aumentam a fila, e a latência sobe de forma proporcional. Isso aponta para saturação de algum recurso.

Uma amostra de `docker stats` tirada durante uma carga de 100 usuários mostrou:

| Container | CPU |
|---|---|
| API (Node) | ~101% |
| PostgreSQL | ~85% |
| k6 | ~116% |

Leitura:

- O processo da API ficou em cerca de **100% de CPU, o equivalente a um núcleo inteiro**. O Node executa o JavaScript em uma única thread, então ele chegou ao teto antes de aproveitar os outros núcleos da máquina. Esse é o limite mais provável.
- O PostgreSQL também estava próximo da saturação, então o banco contribui para o teto.
- O k6 usou mais CPU que a própria API, na mesma máquina. Parte do teto observado vem do ambiente de teste, e o número absoluto de req/s numa máquina separada para o gerador de carga seria maior.

## Verificação cruzada com `/metrics`

O histograma `http_request_duration_seconds` do servidor, lido depois de todas as rodadas acima (valores acumulados, incluindo a carga de 300 usuários), para `POST /orders` com resposta 201:

| Faixa | Requisições |
|---|---|
| até 0,05 s | 47.486 |
| até 0,1 s | 53.400 |
| até 0,2 s | 62.656 |
| até 0,5 s | 63.596 |
| total | 63.967 |

Ou seja, 62.656 de 63.967 requisições (98,0%) terminaram em até 200 ms, incluindo as rodadas de sobrecarga. O servidor mede a latência por dentro da API, sem a rede e a fila do cliente, por isso os valores são menores que os do k6 nas cargas altas.

## Conclusões

- Na carga do smoke test, o p95 (5,7 a 7,2 ms) é cerca de 30 vezes menor que o limite do SLO, e a taxa de erro é zero.
- O SLO de p95 < 200 ms se mantém até algo entre 100 e 300 usuários simultâneos neste ambiente. Não medimos o ponto exato entre os dois.
- O gargalo observado é o processo Node único. Para escalar, os caminhos naturais seriam rodar mais réplicas da API atrás de um balanceador ou usar o modo cluster do Node, mas isso não foi testado.

## Limitações destas medições

- Uma máquina só para API, banco e k6, e o Docker Desktop no Windows acrescenta sobrecarga de rede e de virtualização.
- A amostra de CPU é um único `docker stats` durante uma carga, não uma série temporal.
- Cada carga foi medida uma vez (apenas o smoke test teve três rodadas). Há variação entre rodadas, como mostra a tabela do smoke test.
- O banco começa vazio e cresce durante a medição, então as rodadas finais rodam com mais linhas na tabela que as iniciais.
