
# Phase 02-03: Infra & Skeleton — CONCLUÍDA

> **Status:** ✅ Concluída em 2026-04-20
> **Branch homelab-infra:** `feat/ts-common-packages-deps`
> **Branch typescript-common-packages:** `develop`

---

## Resultado Final

### Fase 2 — Infra Terraform (aplicada no GCP)

| Entregável | Status | Detalhes |
|-----------|--------|----------|
| Módulo `artifact-registry-npm` | ✅ Criado e aplicado | `homelab-infra/terraform/modules/artifact-registry-npm/` (main.tf, variables.tf, outputs.tf) |
| Módulo `gcs-nx-cache` | ✅ Criado e aplicado | `homelab-infra/terraform/modules/gcs-nx-cache/` (main.tf, variables.tf, outputs.tf) |
| Extensão `gcp-github-wif` | ✅ Retrocompatível | `artifact_registry_repositories` (list), `gcs_buckets` (list), variável legada mantida |
| Bootstrap homelab | ✅ Aplicado | Novos módulos chamados, repos adicionados ao WIF |
| State migration | ✅ | `count` → `for_each` no ci_writer sem destroy |

**Recursos GCP provisionados:**
- AR npm `typescript-packages-dev` (us-central1, cleanup 30d)
- Bucket GCS `typescript-nx-cache` (lifecycle 90d, uniform access, public prevention enforced)
- WIF condition atualizada: `homelab-gitops`, `typescript-common-packages`, `ts-express-app`
- IAM: SA `github-actions-ci` com `artifactregistry.writer` (npm) + `storage.objectAdmin` (cache)

### Fase 3 — Esqueleto Nx (commitado)

| Entregável | Arquivo |
|-----------|---------|
| Package raiz | `package.json` — Nx 22.6.5, TS ~5.8.2, Jest ^30, ESLint ^9 |
| Nx config | `nx.json` — remote cache GCS (`nx-remotecache-gcs` MIT), Nx Release independent + version plans |
| TypeScript base | `tsconfig.base.json` — ES2016, nodeNext, decorators, strict |
| NPM config | `.npmrc` — ignore-scripts=true, dual registry (AR comentado) |
| Version plans | `.nx/version-plans/README.md` + `.gitkeep` |
| CI workflow | `.github/workflows/ci.yml` — lint/test/build + publish dev AR via WIF |
| Release workflow | `.github/workflows/release.yml` — version/tag/publish npm --provenance |
| Governance | `.github/CODEOWNERS`, `.github/pull_request_template.md` |
| Docs | `README.md`, `docs/runbooks/package-onboarding.md` |

### Desvios do ADR-0001

| Item ADR | Implementação | Motivo |
|----------|--------------|--------|
| `@pellegrims/nx-remotecache-gcs` | `nx-remotecache-gcs` (wvanderdeijl) | Pacote original não existe no npm; alternativa MIT ativa (v2.2.0) |
| `@nx/remote-cache` como fallback | Não usado | `@nx/gcs-cache` oficial é licença **Commercial**; OSS preferido |
| Node LTS | Node 22 (engines ≥22) | LTS atual abril 2026 |

---

## Prompts Originais Utilizados

Os prompts abaixo foram usados nos chats que executaram esta fase. Mantidos para rastreabilidade.

---

**ADRs e Discovery**

*CONTEXTO*

Você será neste chat um Engenheiro DevOps Senior e tem como tarefa me auxiliar a resolver uma demanda, utilizando boas práticas, padrões solidos de mercado que se adaptem a nossa realizade e segurança.

Eu tenho do workspace atual, com quatro projetos

1. ts-express-app que tem uma estrutura consolidade para uma app back-end profissional e funcional, cujos detalhes encontram-se em docs/agents/REPO_STATUS.md;
2. typescript-common-packages, vazio por enquanto, onde estará contido o novo monorepo Nx.
3. homelab-infra, onde encontra-se a estrutura atual de nossa infra. Deve ser utilizado apenas como referência.
4. homelab-gitops, onde está contido nosso projeto de gitOps. Deve ser utilizado apenas como referência.

*DESAFIO*

1. Precisamos criar um monorepo com Nx para conter todos os pacotes granularizadas para manter o padrão criado em ts-express-app;
2. Uma proposta formal para o monorepo encontra0se em docs/agents/MONOREPO_PROPOSE.md;
3. Antes de iniciarmos qualquer desenvolvimento, precisamos pensar na estratégia de publicação destes pacotes;
4. Precisamos definir a estratégia de publicação, considerando que temos uma estrutura mínima de CICD descrita no arquivo homelab-infra/CLUSTER_STATUS.md;
5. Indicar as alternativas para usar NPM ou alguma outra ferramenta, mostrando prós e contras das alternativas;
7. Demonstrar como o Nx se enquadra nas opções indicadas.

Analise todas as informações e mê dê seu entendimento sobre o que devemos fazer.

**PACKAGES DEPS e INITIAL STRUCTURE**

**CONTEXTO**

Você atuará como **Engenheiro DevOps Senior** e vai continuar uma iniciativa já em andamento.

Tenho quatro repositórios cooperativos no workspace:

1. `ts-express-app` (`~/code/ts-express-app`) — template backend TypeScript/Express enterprise-ready. Documentado em `docs/agents/REPO_STATUS.md` e com a proposta de monorepo em `docs/agents/MONOREPO_PROPOSE.md`.
2. `typescript-common-packages` (`~/code/Personal/typescript-common-packages`) — monorepo Nx alvo desta iniciativa (hoje apenas com o ADR-0001).
3. `homelab-infra` (`~/code/Personal/homelab-infra`) — infra K3s + Terraform + ADRs. **Referência apenas** — não modificar.
4. `homelab-gitops` (`~/code/Personal/homelab-gitops`) — estado desejado reconciliado por ArgoCD. **Referência apenas** — não modificar.

**Leia obrigatoriamente antes de começar, nesta ordem:**

- `typescript-common-packages/docs/adr/ADR-0001-publication-strategy.md` — decisões já tomadas e **não negociáveis** neste chat
- `ts-express-app/docs/agents/MONOREPO_PROPOSE.md` — os 8 pacotes e grafo de dependências
- `ts-express-app/docs/agents/REPO_STATUS.md` — padrões do template que os pacotes devem preservar
- `homelab-infra/CLUSTER_STATUS.md` — estado atual da infra
- `homelab-infra/docs/adr/ADR-0006-cicd-with-github-actions-and-artifact-registry.md` — padrão Terraform + WIF + GitHub Actions a ser espelhado
- `homelab-gitops/.github/workflows/docker-build-push.yaml` — referência de estilo de workflow

**DECISÕES JÁ CONGELADAS (ADR-0001 Accepted — não relitigar):**

- Scope npm: `@bhs-dev/*`
- Registry híbrido: PR builds → GCP Artifact Registry (repo `typescript-packages-dev`, formato npm, região `us-central1`); `develop` → npm público dist-tag `next`; `main` → npm público dist-tag `latest`
- Release tooling: **Nx Release** em modo **independent versioning** com **version plans manuais** (`.nx/version-plans/*.md`)
- Esquema de versão: `<next>-dev.pr<PR_NUM>.<RUN_NUMBER>` / `<next>-next.<N>` / `<next>`
- Check de unicidade via `npm view` / `gcloud artifacts versions describe` com falha de pipeline se existe
- CI/CD: GitHub Actions dentro do próprio monorepo (não em `homelab-gitops`)
- Auth: WIF/OIDC para GCP (reusa SA `github-actions-ci`), Trusted Publisher OIDC para npm público, zero segredos estáticos
- Cache Nx: self-hosted em GCS, bucket `typescript-nx-cache`, path `<package-name>/*`
- Segurança: `--provenance` em publish público, `ignore-scripts=true` no CI, branch protection, lockfile committed, `npm ci`

**DESAFIO**

Executar as **fases 2 e 3** do plano consolidado no chat anterior:

## Fase 2 — Provisionamento de infra (Terraform)

Produzir os módulos Terraform necessários. **Referência obrigatória:** `homelab-infra/terraform/modules/artifact-registry` e `homelab-infra/terraform/modules/gcp-github-wif` (mesmo estilo e convenções).

Entregáveis:

1. Módulo `artifact-registry-npm` (ou extensão do existente) que cria repo `typescript-packages-dev` formato npm, região `us-central1`, projeto `homelab-492918`, com cleanup policy (artefatos com `-dev.` deletados após 30 dias).
2. Módulo `gcs-nx-cache` que cria bucket `typescript-nx-cache` em `us-central1`, lifecycle de 90 dias sem acesso, uniform bucket-level access, versioning desabilitado.
3. Bindings IAM: SA `github-actions-ci` recebe `roles/artifactregistry.writer` no novo repo AR (scoped) e `roles/storage.objectAdmin` no bucket GCS (scoped).
4. Atualização do attribute condition do WIF provider GitHub para permitir também o repo `typescript-common-packages` (junto com os demais).
5. Onde esses módulos devem ser **chamados** (entrypoint do cluster homelab): apenas proponha o diff — o usuário aplica no `homelab-infra` depois.

## Fase 3 — Esqueleto do monorepo Nx

Inicializar o monorepo em `~/code/Personal/typescript-common-packages` (hoje contém apenas `docs/adr/ADR-0001-publication-strategy.md` e `docs/agent/INITIAL_PROMPT.md`). **Zero código de pacote ainda** — somente o andaime.

Entregáveis:

1. `package.json` raiz com Nx e dependências dev mínimas (TypeScript, Jest, ESLint, Prettier — alinhar versões com `ts-express-app`: TS 5.8.2, Jest 30, ESLint config)
2. `nx.json` com:
   - Target defaults para `build`, `test`, `lint`
   - Remote cache configurado para GCS (`typescript-nx-cache`, path `<package-name>/*`, auth via ADC/WIF)
   - Nx Release config: independent versioning, version plans enabled, changelog per project
3. `tsconfig.base.json` espelhando convenções do `ts-express-app` (target ES2016, `nodeNext`, decorators, paths)
4. `.npmrc` com `ignore-scripts=true` e configuração de dual-registry (scope `@bhs-dev` → AR em dev, npm público em stable)
5. `.nx/version-plans/.gitkeep` + `.nx/version-plans/README.md` explicando formato e obrigatoriedade
6. `.github/workflows/ci.yml`:
   - Triggers: `pull_request`, `push` em qualquer branch
   - Steps: checkout, setup Node, `npm ci`, `nx release plan:check` (bloqueia PR sem plan quando `nx affected` detecta mudança), `nx affected -t lint test build`, security scan (`npm audit --audit-level=high`, Trivy filesystem), e apenas em PRs: computação de versão dev, check de unicidade no AR, `nx release publish` com tag `dev` para o AR
   - Usa `google-github-actions/auth@v2` com WIF (`id-token: write`)
7. `.github/workflows/release.yml`:
   - Triggers: `push` em `develop` e `main`
   - Steps: checkout, setup Node, `npm ci`, `nx affected -t lint test build`, `nx release version` (consome plans), commit+tag+push, OIDC Trusted Publisher para npm, check unicidade no npm público, `nx release publish --provenance --tag={next|latest}`, GitHub Release com changelog
8. `.github/CODEOWNERS`, `.github/pull_request_template.md` (com checklist de version plan)
9. `README.md` enxuto: link para ADR-0001, como criar um pacote novo (com referência ao runbook), fluxo de release resumido
10. `docs/runbooks/package-onboarding.md` — 1 página: comando `nx g @nx/js:lib`, template de `package.json` (scope `@bhs-dev`, peerDeps corretas conforme grafo do MONOREPO_PROPOSE.md), checklist de exports/types/tests

**PRINCÍPIOS DE TRABALHO**

- Não relitigar decisões do ADR-0001. Se encontrar algo que justifique revisão, levante explicitamente como "Proposta de revisão ao ADR-0001" antes de implementar.
- Propor mudanças em `homelab-infra` como **diffs/patches para eu aplicar** — não modificar esse repo.
- Não criar nenhum pacote da proposta ainda (nem `typescript-common-types`) — apenas o esqueleto.
- Usar `.npmrc` com `ignore-scripts=true` também no meu ambiente local enquanto desenvolvemos.
- Antes de gerar arquivos em massa, me apresentar um **plano de execução em tópicos** com a ordem dos artefatos e aguardar meu OK.
- Idioma: PT-BR. Estilo dos ADRs e workflows: espelhar `homelab-infra` e `homelab-gitops`.

**COMECE POR**

1. Ler todos os documentos listados acima.
2. Apresentar em tela um resumo do seu entendimento (máx 15 linhas) confirmando que absorveu as decisões congeladas.
3. Apresentar o plano de execução das Fases 2 e 3 em tópicos ordenados.
4. Aguardar meu OK antes de criar/modificar qualquer arquivo.