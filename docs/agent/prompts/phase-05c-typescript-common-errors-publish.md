# Phase 05c: Publicação efetiva de `typescript-common-errors@0.1.0`

> **Objetivo:** fechar a cascata inter-pacote iniciada em 05b — atualizar `typescript-common-errors` para depender de `@bhs-dev/typescript-common-types@^1.0.0` e publicar `errors@0.1.0` via o modelo de release branch dedicada (ADR-0001 Addendum 2026-04-22).
> **Status:** 🟡 Aberta em 2026-04-22
> **Pré-requisitos (leitura obrigatória):**
>
> 1. [phase-05b-release-reconciliation.md](phase-05b-release-reconciliation.md) — seções _Resultado da Investigação_ e _Sequência operacional para publish efetivo_
> 2. [ADR-0001 Addendum 2026-04-22](../../adr/ADR-0001-publication-strategy.md#addendum-2026-04-22--reformulação-do-trigger-de-release-branch-dedicada) — modelo de release branch dedicada e padrão de cascata

---

## Estado confirmado (NÃO revalidar sem necessidade)

- Branch ativa: `develop`, working tree limpo
- `@bhs-dev/typescript-common-types@1.0.0` publicado no npm com dist-tag `latest` (verificado via `npm view`)
- `@bhs-dev/typescript-common-errors` ainda **não existe** no npm (404 esperado)
- Tag git `typescript-common-types@1.0.0` existe em `origin`
- Back-merge PR #7 mergeado → `develop` contém:
  - CHANGELOG de types 1.0.0
  - Plan de types consumido (removido)
  - `nx.json` com `preserveMatchingDependencyRanges: false`, `updateDependents: 'never'`, `versionPlans.ignorePatternsForPlanCheck: ["**/CHANGELOG.md"]`
  - `release.yml` idempotente (guardas por tag git, npm publish, GH release, back-merge PR)
- Plan `.nx/version-plans/typescript-common-errors-initial.md` presente, bump `minor`
- `packages/typescript-common-errors/package.json` com `"@bhs-dev/typescript-common-types": "^0.0.1"` (precisa subir para `^1.0.0`)

---

## Prompt para Novo Chat

```
**CONTEXTO**

Você atuará como **Engenheiro TypeScript Senior** focado em Nx Release, versionamento independente e publicação npm em monorepo.

Tenho quatro repositórios cooperativos no workspace:

1. `ts-express-app` (`~/code/ts-express-app`) — template backend TypeScript/Express. Referência apenas.
2. `typescript-common-packages` (`~/code/Personal/typescript-common-packages`) — monorepo Nx onde vou publicar o pacote `errors`.
3. `homelab-infra` (`~/code/Personal/homelab-infra`) — Referência apenas.
4. `homelab-gitops` (`~/code/Personal/homelab-gitops`) — Referência apenas.

**Leia obrigatoriamente antes de começar, nesta ordem:**

1. `typescript-common-packages/docs/agent/prompts/phase-05c-typescript-common-errors-publish.md` — este prompt (contexto e estado confirmado)
2. `typescript-common-packages/docs/adr/ADR-0001-publication-strategy.md` — especialmente o Addendum 2026-04-22 (modelo de release branch + cascata explícita)
3. `typescript-common-packages/docs/agent/prompts/phase-05b-release-reconciliation.md` — histórico da reconciliação que precedeu esta fase
4. `typescript-common-packages/.github/workflows/release.yml` — workflow idempotente que vai publicar
5. `typescript-common-packages/nx.json` — config de release (`updateDependents: 'never'` é crítico aqui)
6. `typescript-common-packages/.nx/version-plans/typescript-common-errors-initial.md` — plan atual
7. `typescript-common-packages/packages/typescript-common-errors/package.json` — dep a atualizar
8. `typescript-common-packages/packages/typescript-common-errors/src/index.ts` — barrel export (contexto do pacote)

**FATOS JÁ CONFIRMADOS (não revalidar sem necessidade):**

- `@bhs-dev/typescript-common-types@1.0.0` publicado no npm com dist-tag `latest`
- `@bhs-dev/typescript-common-errors` ainda não existe no npm
- Tag git `typescript-common-types@1.0.0` existe em `origin`
- `develop` está no estado pós-release de types (back-merge PR #7 mergeado)
- `release.yml` é idempotente — re-rodar na mesma release branch é seguro
- Permissão "Allow GitHub Actions to create and approve pull requests" já habilitada em Settings
- Version-plan de `errors` presente em `.nx/version-plans/typescript-common-errors-initial.md` com bump `minor`
- `packages/typescript-common-errors/package.json` depende de `@bhs-dev/typescript-common-types: ^0.0.1` — precisa ser atualizado para `^1.0.0`
- Autenticação no npm continua via `NPM_TOKEN` (Trusted Publisher diferido — ver memory e ADR-0001 Addendum 2026-04-20)

**DESAFIO**

Executar a segunda etapa da cascata inter-pacote: publicar `@bhs-dev/typescript-common-errors@0.1.0` no npm público com dist-tag `latest`, consumindo `@bhs-dev/typescript-common-types@^1.0.0`.

### Sequência esperada

1. **Prep PR em `develop`:**
   - Atualizar `packages/typescript-common-errors/package.json`: dep `@bhs-dev/typescript-common-types` de `^0.0.1` para `^1.0.0`
   - Regenerar `package-lock.json` via `npm install --package-lock-only --ignore-scripts`
   - Verificar que o version-plan `typescript-common-errors-initial.md` está íntegro (bump `minor`)
   - Validação local: `CI=1 npx nx release version 0.1.0 --projects=typescript-common-errors --first-release --dry-run` deve produzir 0.1.0 sem tocar types
   - Abrir PR para `develop`
   - Mergear após CI verde

2. **Release branch:**
   - Criar `releases/typescript-common-errors/v0.1.0` a partir de `develop` atualizado
   - Pushar → `release.yml` dispara
   - Workflow valida, bumpa dist manifest para 0.1.0, cria tag `typescript-common-errors@0.1.0`, publica no npm com dist-tag `latest`, cria GitHub Release, abre back-merge PR
   - Merge do back-merge PR para fechar o ciclo

3. **Fechamento:**
   - Atualizar `docs/agent/prompts/phase-05-typescript-common-errors.md` marcando "Publicação concluída"
   - Atualizar `docs/agent/prompts/phase-05b-release-reconciliation.md` — no checklist final, marcar o último item como concluído
   - Opcional: deletar branches `releases/typescript-common-types/v1.0.0` e `releases/typescript-common-errors/v0.1.0` do remote após back-merges

### NÃO fazer

- Não alterar manualmente `packages/typescript-common-errors/package.json` para bumpar a versão para `0.1.0` — o workflow faz isso via `nx release version` na release branch
- Não mexer em `packages/typescript-common-types/*` — types está fechado em 1.0.0
- Não usar trigger por push em `develop` ou `main` — o modelo é apenas via `releases/<package>/v<version>`
- Não tentar publicar `errors` com dep `^0.0.1` — quebraria a semântica (consumidores pegariam types@0.0.1 antigo em vez de 1.0.0)
- Não re-abrir discussão sobre trigger/ADR — decisões congeladas em 05b
- Não commitar alterações em `nx.json` ou `release.yml` — estão finalizados

### Validações antes de mergear o prep PR

- `CI=1 npx nx release plan:check --verbose` — deve passar
- `CI=1 npx nx release version 0.1.0 --projects=typescript-common-errors --first-release --dry-run` — deve mostrar:
  - `errors` bumpado para `0.1.0`
  - `dist/packages/typescript-common-errors/package.json` com `"@bhs-dev/typescript-common-types": "^1.0.0"`
  - Nenhum toque em `types`
- `npm ci --ignore-scripts --dry-run` — deve passar (lockfile consistente com manifests e com registry npm)

### Critério de pronto (phase 05c concluída)

- [ ] Prep PR aberto, CI verde, mergeado em `develop`
- [ ] `releases/typescript-common-errors/v0.1.0` criada, pushada, workflow ✅
- [ ] `@bhs-dev/typescript-common-errors@0.1.0` visível em `npm view @bhs-dev/typescript-common-errors version` com dist-tag `latest`
- [ ] Tag git `typescript-common-errors@0.1.0` em `origin`
- [ ] GitHub Release criada
- [ ] Back-merge PR aberto, mergeado em `develop`
- [ ] Docs de phase-05 e phase-05b atualizadas refletindo o fechamento

**PRINCÍPIOS DE TRABALHO**

- Idioma: PT-BR para comunicação e docs, inglês para código
- Antes de abrir PR, apresentar plano de execução e aguardar OK
- Antes de qualquer ação destrutiva (delete branch, force push, etc.), confirmar
- Preferir edits cirúrgicos — não refatorar config já estabilizada
- Se encontrar estado inesperado (ex: tag órfã, lockfile fora de sincronia sem explicação), investigar antes de editar

**COMECE POR**

1. Ler todos os documentos listados acima
2. Rodar as verificações de estado:
   - `git branch --show-current` (deve ser `develop`)
   - `git status` (deve estar limpo)
   - `git log --oneline -5` (deve mostrar o merge da PR #7)
   - `npm view @bhs-dev/typescript-common-types version` (deve ser `1.0.0`)
   - `ls .nx/version-plans/` (deve listar apenas `typescript-common-errors-initial.md` e `README.md`)
   - `grep -A1 "typescript-common-types" packages/typescript-common-errors/package.json` (deve mostrar `^0.0.1`)
3. Apresentar plano de execução em tópicos ordenados
4. Aguardar meu OK antes de fazer qualquer edit ou push
```

---

## Resultado Esperado

- [ ] Prep PR aberto e mergeado em `develop` (atualiza dep para `^1.0.0` + lockfile)
- [ ] Release branch `releases/typescript-common-errors/v0.1.0` criada e pushada
- [ ] `@bhs-dev/typescript-common-errors@0.1.0` publicado no npm com dist-tag `latest`
- [ ] Back-merge PR mergeado
- [ ] Docs de phase-05 e phase-05b marcadas como concluídas
- [ ] Modelo de cascata inter-pacote (ADR Addendum 2026-04-22) validado fim-a-fim
