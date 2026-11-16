# Uso de IA

O curso permite e espera o uso de IA, desde que declarado. Cada integrante descreve aqui como usou, quais prompts importaram e o que decidiu por conta própria.

## João Pedro Lira

**Ferramenta:** Claude Code (Anthropic), dentro do VS Code.

### Como usei

- **Planejamento:** a IA leu o slide do projeto final, analisou a rubrica e montou o plano da dupla em PDF: divisão por módulo, lista de commits de cada um, requisitos (RF, RN, RNF), contrato entre os módulos e cronograma.
- **Código e testes:** a cada commit, a IA preparava os arquivos e rodava lint, typecheck e testes. Eu lia o diff no Source Control do VS Code, testava a API na mão e só então fazia o `git add` e o `git commit`.
- **Explicações:** em cada commit pedi a explicação dos conceitos usados (padrão Repository, SOLID, consultas parametrizadas no Postgres, configuração por ambiente, logs estruturados, `x-request-id`, coverage) para conseguir defender o código na apresentação.
- **PRs:** a IA rascunhou as descrições dos meus PRs e me ajudou a revisar os PRs do Leandro.
- **Problema de infraestrutura:** quando o CI parou de rodar, a IA ajudou a descobrir que a causa era uma trava de cobrança na minha conta do GitHub (benefício de estudante expirado) e a abrir o ticket no suporte.

### Prompts que importaram

1. *"Você consegue ter acesso a esse slide? [...] todas as páginas do slide"*: leitura das regras e da rubrica.
2. *"Analise os critérios de avaliação e divida tanto os commits quanto as tarefas para os dois"* e *"crie um pdf para que a gente possa se organizar"*: gerou o plano da dupla.
3. *"Fez um commit, pausa. [...] Eu quero acompanhar [...] e quero aprender também no meio do caminho"*: mudou o jeito de trabalhar para um commit por vez, com explicação.
4. *"Acho que esse repo está muito avançado; não seria melhor começar do zero e ir commitando aos poucos?"*: descartamos o primeiro rascunho e recomeçamos com escopo menor.
5. *"Os commits têm que ser todos em inglês"* e *"vamos combinar de fazer todos os comentários em inglês?"*: definiu a convenção de idioma do projeto.

### Decisões que foram minhas

- **Recomeçar do zero.** A primeira versão gerada pela IA tinha mais do que o Projeto B pede (listagem com paginação, controle de concorrência) e eu não conseguiria explicar tudo por conta do tempo. Descartei e refizemos commit a commit.
- **Ritmo e controle do Git.** Um commit por vez; eu mesmo faço `git add` e `git commit`, depois de ver o diff.
- **Idioma.** Código, comentários, commits e mensagens da API em inglês; README e documentação em português.
- **Repositório na minha conta.** Depois que o suporte do GitHub destravou a conta, trouxe o repositório de volta da conta do Leandro.

### O que corrigi no que a IA fez

- Ela fez um commit sozinha quando eu queria fazer; desfiz e refiz eu mesmo.
- Um teste gerava a mensagem misturada `Pedido does-not-exist não encontrado`; percebi a mistura de idiomas e isso levou à decisão de deixar as mensagens da API em inglês.
- Uma descrição de PR veio com uma nota do PR anterior; pedi a versão correta.

## Leandro Frota

**Ferramenta:** Claude Code (Anthropic), dentro do VS Code.

### Como usei

- **Planejamento:** a IA leu o plano da dupla (PDF) e organizou meus commits L1 a L14 em fases, com a ordem e as dependências com o João (por exemplo, o L7 só depois do `POST /orders` dele).
- **Código, testes e documentos:** a cada etapa a IA explicava o que ia fazer e eu autorizava. Depois ela escrevia os arquivos e rodava lint, typecheck, testes e, quando era o caso, o Docker. Os commits foram feitos pela IA na minha conta do git, **depois da minha autorização de cada etapa**. O `git push` e a abertura dos PRs foram feitos por mim.
- **Medição de desempenho:** a IA rodou o k6 pelo Docker (ele não está instalado na minha máquina) e registrou os números em `docs/desempenho.md`. Os valores vêm das execuções, não de estimativa.
- **PRs:** a IA rascunhou as descrições dos meus PRs. Eu colei no GitHub.
- **Problemas:** a IA ajudou a entender o CI parado por trava de cobrança na conta dona do repositório (não era erro do código) e a resolver o conflito de `package-lock.json` e `README.md` do PR #9.

### Prompts que importaram

1. *"Esse é o cronograma do meu trabalho [...] meus commits descritos no item 7. Faça uma leitura e me auxilie nesse projeto."*: o ponto de partida.
2. *"Faça um passo a passo do que devo fazer [...] você vai fazer cada etapa, mas quero que me explique antes e peça autorização."*: definiu o jeito de trabalhar, uma etapa por vez, com explicação e autorização.
3. *"Convencionar a consistência do código em inglês, segue o exemplo. Faça as alterações necessárias."*: a IA traduziu a mensagem de erro e os nomes de testes da máquina de estados e passou a seguir a convenção.
4. *"Da próxima vez não se coloque como coautor."*: tirei a IA como coautora dos commits e das descrições de PR a partir daí.
5. O conflito do PR #9 (colei o trecho do `package-lock.json`): a IA explicou que o lockfile é gerado, pegou o da `main`, rodou `npm install` e reencaixou minha seção no README novo do João.

### Decisões que foram minhas

- **Uma etapa por vez, com autorização.** Nada foi commitado sem eu aprovar a etapa antes.
- **Idioma.** Código, comentários, commits e mensagens da API em inglês; README, ADR e documentação em português.
- **Sem a IA como coautora.** Pedi para retirar o `Co-Authored-By` e a linha de atribuição nos PRs.
- **Escopo.** Mantive o Dockerfile multi-stage e o endpoint `/ship`, que o plano permitia cortar, porque deu tempo e eu consigo explicá-los.
- **Parar para o Docker.** Quando o Docker Desktop estava parado, esperei ligá-lo em vez de commitar sem testar.

### O que corrigi no que a IA fez

- A primeira versão da máquina de estados tinha a mensagem de erro e os nomes dos testes em português. Corrigi depois de definirmos a convenção (commit `refactor: use English for state machine error and test names`).
- Os commits L1 a L8 saíram com a linha `Co-Authored-By` da IA, antes de eu pedir para tirar. Os commits seguintes não têm. Não reescrevi o histórico já publicado.
- A porta 3000 da minha máquina estava ocupada por outro projeto, e o primeiro teste do Docker bateu nele. Por isso o compose aceita `API_PORT`.
- A IA começou o `docs/desempenho.md` com uma carga só. Pedi medições reais, e ela rodou 3 rodadas do smoke test e cargas maiores, e descreveu o gargalo com a CPU medida (`docker stats`) em vez de apenas supor.

### O que sei explicar

Máquina de estados no domínio e por que não `if`s no controller (ADR 0001); o `updateStatus` no repositório e a limitação de ler e depois gravar sem trava; o histograma com bucket em 0,2 s para o SLO; a label `route` com o padrão da rota para evitar cardinalidade alta; e por que o p95 sobe com a carga (a vazão fica em cerca de 1.300 req/s, e o processo Node de thread única chega a ~100% de CPU).
