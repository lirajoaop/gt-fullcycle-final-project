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

> A preencher pelo Leandro.
