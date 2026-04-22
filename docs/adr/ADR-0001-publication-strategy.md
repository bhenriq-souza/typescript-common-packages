# ADR-0001: Estratégia de Publicação do Monorepo `typescript-common-packages`

## Status

Accepted — com [Addendum 2026-04-20](#addendum-2026-04-20--primeira-publicação-e-desvios-observados) registrando desvios operacionais na bootstrap da pipeline.

## Context

O repositório `ts-express-app` consolidou um padrão enterprise-ready para APIs Node/TypeScript (tsyringe DI, Winston, Zod, error handling centralizado, HTTP client com retry). A proposta formal em [MONOREPO_PROPOSE.md](../../../ts-express-app/docs/agents/MONOREPO_PROPOSE.md) extrai oito pacotes reutilizáveis desse template:

```
types → errors, env, context, express
        env → logger
        context → logger
        logger → http
        {types, logger, context, http, errors} → middlewares
```

Esses pacotes serão desenvolvidos em monorepo Nx no repositório `typescript-common-packages` e consumidos inicialmente pelo próprio `ts-express-app`.

A infraestrutura de CICD já operacional no homelab (ver [ADR-0006](../../../homelab-infra/docs/adr/ADR-0006-cicd-with-github-actions-and-artifact-registry.md) e [CLUSTER_STATUS.md](../../../homelab-infra/CLUSTER_STATUS.md)) fornece:

- GCP Artifact Registry (hoje formato Docker; suporta formato npm)
- Workload Identity Federation (OIDC) GitHub Actions → GCP, sem chaves estáticas
- Service Account `github-actions-ci` já provisionada
- Padrão de secrets via GCP Secret Manager + ESO
- ArgoCD para deploy de apps (fora do escopo deste ADR, já que pacotes npm não são deployados)

Não existe hoje no homelab um registry npm nem tooling de release de bibliotecas. Este ADR define o stack completo de publicação antes de iniciar o código dos pacotes.

## Decision

### 1. Scope npm

- **Scope adotado:** `@bhs-dev/*`
- **Justificativa:** o scope `@bhs` (3 letras) não pôde ser definitivamente verificado sem tentativa de `npm publish` (registry retorna 404 para pacote inexistente tanto em scope livre quanto em scope reservado sem publicações; UI `npmjs.com` bloqueia HEAD anônimo via Cloudflare). Scopes de 3 letras no npm são largamente reservados desde 2020, e adotar `@bhs-dev` de início elimina o risco de rework no primeiro publish.
- **Condição para revisão:** se em validação `npm publish` atestar que `@bhs` está livre e o usuário preferir renomear, atualizar este ADR para 0001a (supersede) — o restante da estratégia não muda.

### 2. Registry — abordagem híbrida

| Gatilho                 | Destino                             | Tag/Canal                        | Visibilidade |
| ----------------------- | ----------------------------------- | -------------------------------- | ------------ |
| PR aberto ou atualizado | GCP Artifact Registry (formato npm) | N/A — instalado por versão exata | Privado      |
| Merge em `develop`      | npm público (`registry.npmjs.org`)  | dist-tag `next`                  | Público      |
| Merge em `main`         | npm público                         | dist-tag `latest`                | Público      |

**Provisionamento do AR npm:**

- Novo repositório no projeto GCP `homelab-492918`, região `us-central1`, formato `npm`
- Nome proposto: `typescript-packages-dev` (explicita intenção e separa do `homelab-apps` Docker)
- URL base: `https://us-central1-npm.pkg.dev/homelab-492918/typescript-packages-dev/`
- Cleanup policy: artefatos `*-dev.*` deletados após 30 dias
- SA `github-actions-ci` recebe `roles/artifactregistry.writer` escopado ao novo repositório
- Provisionamento via módulo Terraform espelhando `terraform/modules/artifact-registry` do `homelab-infra`

**Consumo local:** `ts-express-app` e demais consumidores configuram `.npmrc` com dois registries — scope `@bhs-dev` aponta para AR em dev, npm público para versões estáveis.

### 3. Release tooling

- **Nx Release** (nativo a partir do Nx 17+) em modo **independent versioning**
- **Version plans manuais** em `.nx/version-plans/*.md` (escolha deliberada sobre conventional commits, para histórico auditável forte)
- Cada PR que alterar código de pacote deve incluir um version plan descrevendo intenção do bump e motivo
- Changelog gerado por pacote a partir dos version plans consolidados no release

### 4. Esquema de versionamento

| Canal            | Padrão                               | Exemplo            |
| ---------------- | ------------------------------------ | ------------------ |
| PR (dev)         | `<next>-dev.pr<PR_NUM>.<RUN_NUMBER>` | `1.3.0-dev.pr42.3` |
| `develop` (next) | `<next>-next.<N>`                    | `1.3.0-next.7`     |
| `main` (latest)  | `<next>`                             | `1.3.0`            |

`<next>` é computado por `nx release version --dry-run` a partir dos version plans acumulados desde a última release em `main`.

**Propriedades:**

- Unicidade por construção no canal dev (par PR+RUN nunca colide)
- Dev artefato informa para qual versão estável ele vai virar (debug de integração)
- `develop` acumula release candidates antes de promoção para `main`

### 5. Check de unicidade (requisito explícito)

Antes de cada publish, pipeline executa:

```bash
# Para npm público
npm view "@bhs-dev/<pkg>@<version>" version 2>/dev/null && { echo "ERRO: versão já publicada"; exit 1; }

# Para GCP AR
gcloud artifacts versions describe "<version>" \
  --package="<pkg>" \
  --repository=typescript-packages-dev \
  --location=us-central1 2>/dev/null && { echo "ERRO: versão já publicada"; exit 1; }
```

Rede de segurança: mesmo com esquema único por construção, o check protege contra retry manual, rebase que reutiliza run number, ou erro de configuração.

### 6. CI/CD — GitHub Actions no monorepo

Workflows vivem em `typescript-common-packages/.github/workflows/` (não em `homelab-gitops`, para não acoplar release de lib à config do Nx/version-plans centralizados).

**`ci.yml`** (trigger: `pull_request` e `push` em qualquer branch)

1. Checkout + setup Node (versão LTS atual, matching Dockerfile do `ts-express-app`)
2. `npm ci` (lockfile estrito)
3. **Validação de version plan:** `nx release plan:check` — falha se `nx affected` detecta mudança em pacote sem plano correspondente
4. `nx affected -t lint test build` (cache hit via GCS)
5. Security scan: `npm audit --audit-level=high`, `trivy fs .` (vulnerabilidades em dependências transitivas)
6. **Apenas em `pull_request`:** auth WIF → check unicidade → `nx release publish --registry=<AR_URL> --tag=dev --dry-run=false` com versão computada

**`release.yml`** (trigger: `push` em `develop` e `main`)

1. Checkout + setup Node
2. `npm ci`
3. `nx affected -t lint test build`
4. `nx release version` (consome version plans, atualiza `package.json`s, remove plans consumidos)
5. Commit + tag + push
6. Auth OIDC Trusted Publisher → npm público
7. Check unicidade → `nx release publish --registry=https://registry.npmjs.org --tag=<next|latest> --provenance`
8. GitHub Release com changelog consolidado

### 7. Autenticação (sem credenciais estáticas)

| Destino               | Mecanismo                                                    | Segredo                                                            |
| --------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------ |
| GCP Artifact Registry | Workload Identity Federation (reusa pool/provider existente) | Nenhum — `id-token: write` + `google-github-actions/auth@v2`       |
| npm público           | Trusted Publisher via OIDC (npm ≥ 2023)                      | Nenhum — configurado em `npmjs.com` apontando para o repo+workflow |
| GCS (cache Nx)        | Mesma WIF, SA `github-actions-ci`                            | Nenhum                                                             |

Nenhum `NPM_TOKEN`, `GOOGLE_CREDENTIALS` ou PAT no `secrets` do repositório.

### 8. Cache Nx — GCS self-hosted

- **Bucket:** `typescript-nx-cache` (GCS, mesma região `us-central1`)
- **Path layout:** `<nome-do-package>/*` — isolamento por pacote
- **Backend:** `@nx/remote-cache` com adaptador GCS (ou wrapper oficial Nx com credenciais ADC via WIF)
- **Lifecycle:** objetos sem acesso por 90 dias são deletados (controle de custo)
- **Auth:** SA `github-actions-ci` ganha `roles/storage.objectAdmin` escopado ao bucket
- Provisionamento via Terraform, no mesmo plano do repo AR npm

### 9. Segurança

- **Provenance (SLSA):** `--provenance` obrigatório em publish no npm público
- **`ignore-scripts=true`** no `.npmrc` do CI (defesa contra scripts maliciosos em deps transitivas)
- **Branch protection:** `main` e `develop` exigem PR + CI verde + version plan presente
- **Lockfile:** `package-lock.json` commitado, `npm ci` (não `npm install`) no CI
- **Dependabot:** ativo para patches de dev deps (auto-merge em verde), revisão manual para minor/major
- **`engines` strict:** todos os pacotes declaram Node LTS mínimo e o CI valida
- **Peer dependencies** corretamente declaradas (`express`, `tsyringe`, `zod`) — não empacotadas

## Consequences

### Positivas

- Stack de publicação **100% OIDC**, coerente com o padrão do `ADR-0006` do homelab
- Reuso integral da infra GCP existente (WIF, SA, Terraform patterns) — baixo custo de onboarding
- Dev artifacts isolados no AR privado não poluem o namespace público do npm
- Version plans entregam histórico de release auditável e independente de disciplina de commits
- `nx affected` + cache GCS minimizam rebuild/republish desnecessário
- Esquema de versionamento informa aos consumidores qual release estável cada dev artifact antecipa
- Check de unicidade protege contra republish acidental (via rede múltipla: esquema único + verificação explícita + immutability do registry)

### Negativas

- Requer provisionamento de dois novos recursos GCP (AR npm repo, GCS bucket) — trabalho Terraform adicional
- Consumidores de dev packages precisam `.npmrc` autenticado contra AR (fricção local, mas alinhada ao padrão de dev no ecossistema GCP)
- Version plan esquecido bloqueia merge — fricção intencional, requer disciplina
- Scope `@bhs-dev` é menos "limpo" que `@bhs`; migração futura para `@bhs` implica rework de consumidores
- Dois workflows (`ci` e `release`) precisam ser mantidos sincronizados com a configuração Nx
- Trusted Publisher no npm exige cadastro único manual via UI em `npmjs.com`

## Alternatives Considered

### Registry

- **npm público para todos os canais (inclusive PR):** descartado. npm é imutável e não permite overwrite nem delete após 72h — cada PR deixaria artefato eterno, poluindo o namespace. Para projeto pessoal é ruído aceitável, mas desnecessário dado que a infra GCP cobre o caso privado sem custo adicional.
- **GitHub Packages (formato npm):** descartado. Exige `.npmrc` autenticado mesmo para pacotes públicos, adicionando fricção ao consumidor. Não há vantagem frente a GCP AR e perde a discoverability do npm público.
- **Verdaccio self-hosted no K3s:** descartado. Adiciona workload com responsabilidades de storage, backup, TLS, ingress. Ganho (controle total) não compensa a sobrecarga operacional em cenário homelab single-node.
- **JSR (`jsr.io`):** descartado. Ecossistema ainda imaturo para bibliotecas Node/CommonJS em 2026; resolveria-se como dupla publicação sem ganho prático.

### Release tooling

- **Conventional Commits + Nx Release (automático):** inicialmente preferido pela baixa fricção. Descartado a pedido do usuário em favor de version plans, que garantem histórico auditável e decisão explícita de bump por PR, ao custo de um arquivo manual por PR.
- **Changesets (`@changesets/cli`):** excelente tooling, padrão em muitas libs OSS. Descartado pela duplicidade com o grafo Nx — em repo Nx, Nx Release é a ferramenta natural e version plans cobrem o mesmo padrão de UX.
- **semantic-release + multi-semantic-release:** descartado. Versão decidida puramente por parse de commits é frágil em monorepo, e `multi-semantic-release` tem manutenção irregular e integração instável com Nx.

### Cache Nx

- **Nx Cloud (SaaS gratuito até certo limite):** descartado. Terceiriza cache para infra externa, não alinha com postura "tudo em casa" do homelab, e torna o pipeline dependente de serviço fora do controle do usuário.
- **Cache local apenas (sem remoto):** descartado. Perde ganho do cache entre runs de CI e entre máquinas — um dos principais valores do Nx em CI.

### Workflows centralizados

- **Reusable workflow em `homelab-gitops` (como Docker):** descartado. Release de lib Node tem acoplamento forte com configuração Nx específica do monorepo (version plans, release targets, dependências entre pacotes). Centralizar criaria rigidez sem ganho real. Mantida a centralização apenas para workflows de apps Docker, onde o padrão é genuinamente repetitivo.

---

## Addendum 2026-04-20 — Primeira publicação e desvios observados

### Conquista

Primeiro publish bem-sucedido do monorepo em **2026-04-20**:

| Item       | Valor                                                                                                                               |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Pacote     | `@bhs-dev/typescript-common-types`                                                                                                  |
| Versão     | `0.0.1`                                                                                                                             |
| dist-tag   | `latest`                                                                                                                            |
| Registry   | `https://registry.npmjs.org`                                                                                                        |
| Provenance | SLSA attestation anexada via `--provenance`                                                                                         |
| Workflow   | `.github/workflows/release.yml` (push em `main`)                                                                                    |
| Validação  | `npm view @bhs-dev/typescript-common-types@0.0.1` retorna metadata; consumido com sucesso por `ts-express-app` via barrel re-export |

Com isso, o canal `main → npm público (tag latest)` da **Decision §2** está operacional e foi validado fim-a-fim.

### Desvios do plano

#### D1 — Autenticação no npm público via `NPM_TOKEN`, não via Trusted Publisher

**Planejado (Decision §7):** "npm público | Trusted Publisher via OIDC | Nenhum — configurado em `npmjs.com` apontando para o repo+workflow" e "Nenhum `NPM_TOKEN` [...] no `secrets` do repositório."

**Implementado no primeiro release:**

- Criado secret `NPM_TOKEN` no repositório (Repository Secret, não Environment Secret)
- Step `Configure npm authentication` escreve `//registry.npmjs.org/:_authToken=${NPM_TOKEN}` em `~/.npmrc`
- Step de publish exporta `NODE_AUTH_TOKEN` para `npx nx release publish`

**Razão do desvio:**

1. **Chicken-egg do Trusted Publisher.** A UI do `npmjs.com` exige que o pacote **já exista** no registry para configurar Trusted Publisher (owner + repo + workflow + environment). Sem um primeiro publish prévio, não há página de configuração para apontar. Descoberta só confirmada durante a própria tentativa de setup.
2. **Granular Access Token com 2FA-bypass desmarcado.** A primeira tentativa usou um granular token escopado em `@bhs-dev`. O npm retornou `403 Forbidden — granular access token with bypass 2fa enabled is required to publish packages` — tokens granulares exigem a flag "Bypass two-factor authentication (2FA)" marcada no momento da criação, e essa flag **não é editável** após gerar o token.
3. **Pivot para Classic Automation Token.** Classic Automation Tokens bypassam 2FA por design (documentado pelo npm). Troca do secret por um token Classic resolveu o publish imediatamente.

**Status da dívida técnica:** rastreada em [phase-04b-trusted-publisher.md](../agent/prompts/archive/phase-04b-trusted-publisher.md) (**arquivada em 2026-04-22**). A migração foi **diferida** até o publish inaugural de todos os pacotes do monorepo, porque o Trusted Publisher do npm é configurado por pacote e só fica disponível após o primeiro publish de cada um — migrar logo após o primeiro pacote forçaria o ciclo "reativar `NPM_TOKEN` → publicar novo pacote → reconfigurar Trusted Publisher → remover `NPM_TOKEN`" em cada phase subsequente. Durante o intervalo, `NPM_TOKEN` permanece como mecanismo único de autenticação.

#### D2 — Secret inicialmente em Environment Secrets, não Repository Secrets

**Sintoma inicial:** `401 Unauthorized` mesmo com o secret criado, porque `${{ secrets.NPM_TOKEN }}` expandia para string vazia.

**Raiz:** o secret foi criado sob **Environment Secrets** (GitHub → Settings → Environments → <env>). Steps do workflow sem declaração `environment:` **não enxergam** Environment Secrets — só enxergam Repository Secrets e Organization Secrets.

**Correção aplicada:** secret movido para Repository Secrets. Não é um desvio do plano do ADR, mas fica registrado como gotcha operacional para futuros onboardings.

#### D3 — Step `Configure npm authentication` é redundante

`actions/setup-node@v4` com `registry-url` já cria `.npmrc` em `$RUNNER_TEMP/.npmrc` e exporta `NPM_CONFIG_USERCONFIG`. O step manual escrevendo em `~/.npmrc` é redundante — apenas `NODE_AUTH_TOKEN` como env var do step de publish seria suficiente. Manter ou remover é decisão cosmética; registrado aqui para revisão na próxima iteração.

### Consequências atualizadas

**Positivas (adicionadas):**

- Estratégia comprovada fim-a-fim: version plans → Nx release → push/tag → publish → consumo em downstream
- Provenance SLSA anexada sem configuração extra além do flag `--provenance`

**Negativas (adicionadas):**

- Existência prolongada de `NPM_TOKEN` no repositório viola o princípio "zero credenciais estáticas" do ADR-0006. Dívida técnica rastreada em phase-04b (arquivada 2026-04-22, diferida até publish inaugural de todos os pacotes do monorepo)
- Token Classic Automation tem escopo **de conta inteira** (não scopable a `@bhs-dev`). Blast radius maior que o necessário — mitigação: manter o token estritamente no período de bootstrap dos pacotes e migrar para Trusted Publisher assim que o último pacote for publicado pela primeira vez

### Condição de revisão deste ADR

Quando phase-04b for retomada (após publish inaugural de todos os pacotes do monorepo) e concluída — `NPM_TOKEN` removido do repositório — atualizar a tabela §7 (Autenticação) refletindo o estado final e marcar este addendum como "resolvido" com nota de data.
