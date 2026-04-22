# Phase 05: Segundo Pacote — `typescript-common-errors` — IMPLEMENTAÇÃO CONCLUÍDA

> **Status:** ✅ Implementação concluída em 2026-04-22
> **Publicação:** 🟡 Pendente — bloqueada por divergência entre git tag, manifests locais e versão publicada de `typescript-common-types`
> **Branch original de implementação:** `feat/initial-configs`

---

## Resultado Final

### Pacote `@bhs-dev/typescript-common-errors`

| Entregável                    | Status | Detalhes                                                                                                                                   |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Geração via `nx g @nx/js:lib` | ✅     | `packages/typescript-common-errors/` com `tsc`, `eslint` e `jest`                                                                          |
| `package.json`                | ✅     | `0.0.1`, `publishConfig.access: "public"`, `engines.node >= 22`, dependency em `@bhs-dev/typescript-common-types`, zero `peerDependencies` |
| Implementação `CustomError`   | ✅     | `src/errors/custom-error.ts` com `status`, `code`, `details`, `isOperational`, `exposeMessage`, `cause` opcional e 9 factories HTTP        |
| Barrel export                 | ✅     | `src/errors/index.ts` + `src/index.ts` reexportando a API pública                                                                          |
| Reuso de `CustomErrorOptions` | ✅     | Importado de `@bhs-dev/typescript-common-types`, sem redefinição local                                                                     |
| Testes unitários              | ✅     | 2 suites, 13 testes (`custom-error.spec.ts` + `barrel.spec.ts`)                                                                            |
| Path alias raiz               | ✅     | `@bhs-dev/typescript-common-errors` apontando para `packages/typescript-common-errors/src/index.ts`                                        |
| README do pacote              | ✅     | Documentação específica do pacote com propriedades, factories e exemplos de uso                                                            |
| Version plan                  | ✅     | `.nx/version-plans/typescript-common-errors-initial.md` com nome Nx `typescript-common-errors`                                             |
| Build                         | ✅     | `nx run typescript-common-errors:build`                                                                                                    |
| Test                          | ✅     | `nx run typescript-common-errors:test`                                                                                                     |
| Lint                          | ✅     | `nx run typescript-common-errors:lint`                                                                                                     |
| Grafo Nx                      | ✅     | Dependência estática `typescript-common-errors` → `typescript-common-types` confirmada                                                     |

### Pendência aberta de publicação

Apesar de a implementação do pacote estar concluída e validada localmente, o **publish do pacote `@bhs-dev/typescript-common-errors` ainda não foi concluído**.

#### Estado atual confirmado

| Item                                                | Estado atual                                           | Evidência                                                            |
| --------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------- |
| `@bhs-dev/typescript-common-types` publicado no npm | `0.0.1`                                                | `npm view @bhs-dev/typescript-common-types version` retornou `0.0.1` |
| `packages/typescript-common-types/package.json`     | `0.0.1`                                                | Mantido alinhado ao pacote publicado                                 |
| `packages/typescript-common-errors/package.json`    | depende de `@bhs-dev/typescript-common-types: ^0.0.1`  | Mantido alinhado ao pacote publicado                                 |
| `release.yml`                                       | usa `nx release` com `currentVersionResolver: git-tag` | O resolver de versão atual vem de tags git, não do npm registry      |
| Workflow `release.yml`                              | falha no step `Version, changelog, commit & tag`       | `preserveMatchingDependencyRanges` bloqueia a release                |

#### Erro atual no `release.yml`

Trecho relevante do log observado após merge em `develop`:

```text
typescript-common-errors Applied semver relative bump "minor" ... to get new version 0.1.0
typescript-common-types Resolved the current version as 0.1.0 from git tag "typescript-common-types@0.1.0"
typescript-common-types No changes were detected within version plans
NX "preserveMatchingDependencyRanges" is enabled for "dependencies" and the new version "^0.1.0" is outside the current range for "@bhs-dev/typescript-common-types" in manifest "dist/packages/typescript-common-errors/package.json".
```

#### Leitura atual do problema

- O `nx release` está tratando **git tags** como fonte de verdade para a versão corrente de `typescript-common-types`.
- O workflow resolve `typescript-common-types` como **`0.1.0`** a partir da tag `typescript-common-types@0.1.0`.
- O **npm registry**, porém, ainda expõe **apenas `0.0.1`** para `@bhs-dev/typescript-common-types`.
- O manifesto do pacote `errors` está em `^0.0.1`, o que é coerente com o npm público atual, mas **não** com a versão corrente resolvida pelo `nx release` a partir da tag.
- Tentar mudar o range para `^0.1.0` torna o `npm install` inconsistente com a realidade do registry, porque `@bhs-dev/typescript-common-types@0.1.0` **não existe publicado** no npm.

**Conclusão provisória:** existe uma divergência não resolvida entre:

1. a versão publicada no npm de `@bhs-dev/typescript-common-types` (`0.0.1`)
2. a versão corrente resolvida por tag git no `nx release` (`0.1.0`)
3. o range de dependência interna que `typescript-common-errors` pode declarar sem quebrar o install

Enquanto essa reconciliação não for feita, a implementação da Fase 05 fica **entregue**, mas a publicação permanece **pendente**.

### Tentativas de correção já realizadas neste chat

#### 1. Implementação e validação local do pacote

- `typescript-common-errors` foi criado, com `CustomError`, factories HTTP, barrel export, testes, README e version plan.
- Validações locais executadas com sucesso:
  - `nx run typescript-common-errors:build`
  - `nx run typescript-common-errors:test`
  - `nx run typescript-common-errors:lint`

#### 2. Correção do `npm ci` no CI do PR

**Sintoma:** o job `Install dependencies` falhou com `npm ci` reclamando que `package-lock.json` e `package.json` estavam fora de sincronia, faltando `@bhs-dev/typescript-common-errors@0.0.1` no lockfile.

**Ação feita:**

- Executado `npm install --package-lock-only --ignore-scripts`
- Validado com `npm ci --ignore-scripts --dry-run`

**Resultado:** o CI do PR passou após o `package-lock.json` atualizado ser incluído.

#### 3. Correção do comentário de coverage no PR

**Sintoma:** o PR mostrava `NaN% / Unknown%` no comentário de coverage, embora o report local estivesse correto.

**Diagnóstico:**

- Os testes com `--coverage` rodavam normalmente.
- O comentário do PR dependia de `coverage/merged/coverage-summary.json`.
- O workflow tentava usar `nyc merge coverage ...`, mas a cobertura era gerada por pacote em subpastas e o merge saía vazio (`{}`).

**Ação feita:**

- Ajustado `.github/workflows/ci.yml` para agregar diretamente os `coverage-summary.json` gerados por pacote.

**Resultado:** o comentário de coverage do PR deixou de depender de um merge vazio e passou a consolidar os summaries por pacote corretamente.

#### 4. Investigação do erro de release (`preserveMatchingDependencyRanges`)

**Primeiras hipóteses e testes feitos:**

- Verificado que `^0.0.1` **não** satisfaz `0.1.0`
- Verificado que `^0.1.0` satisfaz `0.1.0`
- Executado `CI=1 npx nx release --skip-publish --first-release --dry-run`

**Ações tentadas:**

- Tentativa A: alterar `packages/typescript-common-errors/package.json` para depender de `@bhs-dev/typescript-common-types: ^0.1.0`
- Tentativa B: alinhar `packages/typescript-common-types/package.json` para `0.1.0`

**Resultados observados:**

- `npm install --package-lock-only --ignore-scripts` falhou com `ETARGET` porque `@bhs-dev/typescript-common-types@^0.1.0` **não existe** no npm público
- Foi aberto um PR intermediário com essas mudanças de manifesto, mas ele tocava `typescript-common-types` indevidamente e foi fechado
- Os manifests foram então devolvidos ao estado coerente com o registry:
  - `packages/typescript-common-types/package.json` → `0.0.1`
  - `packages/typescript-common-errors/package.json` → `@bhs-dev/typescript-common-types: ^0.0.1`

#### 5. Confirmações obtidas

- `CI=1 npx nx release plan:check --verbose` **passa** localmente
- O problema atual **não** é falta de version plan
- O problema atual **não** é `package-lock.json`
- O problema atual **não** é build/test/lint/coverage
- O problema atual está concentrado na reconciliação entre:
  - tags git consumidas pelo `nx release`
  - versões efetivamente publicadas no npm
  - ranges internos entre `typescript-common-types` e `typescript-common-errors`

#### 6. O que não deve ser repetido sem nova análise

- Não abrir novo PR alterando `packages/typescript-common-types/package.json` apenas para “acompanhar” o erro do release
- Não subir `@bhs-dev/typescript-common-types: ^0.1.0` em `packages/typescript-common-errors/package.json` enquanto o npm registry continuar expondo somente `0.0.1`
- Não tratar o erro como problema de version plan, coverage ou lockfile: esses pontos já foram validados separadamente

### Ajustes aprendidos durante a fase

| Item                          | Status | Detalhes                                                                                                                                                |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fonte de `CustomErrorOptions` | ✅     | O prompt original citava `ts-express-app/src/types/common.types.ts`, mas a fonte de verdade já estava consolidada em `@bhs-dev/typescript-common-types` |
| Padrão de config Jest         | ✅     | O monorepo segue `jest.config.cts`, não `jest.config.ts`                                                                                                |
| Convenção Nx vs nome npm      | ✅     | Os comandos `nx run ...` usam o nome do projeto (`typescript-common-errors`), enquanto o nome npm fica no `package.json`                                |
| Higiene de entrega            | ✅     | README específico do pacote e version plan passaram a ser parte do fechamento esperado da fase                                                          |

### Desvios do plano original

| Item planejado                                                                              | Implementado                                                 | Motivo                                                            |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------- |
| `ts-express-app/src/types/common.types.ts` como referência direta para `CustomErrorOptions` | Reuso do tipo a partir de `@bhs-dev/typescript-common-types` | O contrato já havia sido extraído e estabilizado na Fase 04       |
| `jest.config.ts`                                                                            | `jest.config.cts`                                            | Este é o padrão efetivamente gerado e utilizado no monorepo atual |
| Validação com `nx run @bhs-dev/typescript-common-errors:*`                                  | Validação com `nx run typescript-common-errors:*`            | O Nx resolve targets pelo nome do projeto, não pelo nome npm      |

---

## Prompt Original Utilizado

```
**CONTEXTO**

Você atuará como **Engenheiro TypeScript Senior** e vai implementar o segundo pacote do monorepo Nx.

Tenho quatro repositórios cooperativos no workspace:

1. `ts-express-app` (`~/code/ts-express-app`) — template backend TypeScript/Express enterprise-ready. Fonte do código a ser extraído.
2. `typescript-common-packages` (`~/code/Personal/typescript-common-packages`) — monorepo Nx com o primeiro pacote já implementado (Fase 04 concluída).
3. `homelab-infra` (`~/code/Personal/homelab-infra`) — infra Terraform. **Referência apenas**.
4. `homelab-gitops` (`~/code/Personal/homelab-gitops`) — GitOps. **Referência apenas**.

**Leia obrigatoriamente antes de começar, nesta ordem:**

1. `typescript-common-packages/docs/agent/prompts/phase-04-typescript-common-types.md` — resultado da fase anterior (seção "Resultado Final")
2. `typescript-common-packages/docs/adr/ADR-0001-publication-strategy.md` — decisões congeladas
3. `typescript-common-packages/docs/runbooks/package-onboarding.md` — processo de criação de pacote
4. `typescript-common-packages/package.json` — dependências raiz e versões
5. `typescript-common-packages/nx.json` — config Nx Release e cache
6. `typescript-common-packages/tsconfig.base.json` — convenções TypeScript e path aliases existentes
7. `typescript-common-packages/packages/typescript-common-types/` — pacote já implementado (referência de estrutura)
8. `ts-express-app/docs/agents/MONOREPO_PROPOSE.md` — grafo de dependências dos 8 pacotes
9. `ts-express-app/src/common/customErrors.common.ts` — classe CustomError a extrair
10. `ts-express-app/src/types/common.types.ts` — CustomErrorOptions (já extraído para types, reusar)
11. `ts-express-app/tests/common/customErrors.common.spec.ts` — testes a portar

**DECISÕES JÁ CONGELADAS (não relitigar):**

- Scope npm: `@bhs-dev/*`
- Todas as decisões do ADR-0001 permanecem válidas
- Esqueleto do monorepo funcional (Nx 22.6.5, TS ~5.8.2, Jest ^30)
- Infra GCP já aplicada (AR npm, GCS cache, WIF)
- Pacote `typescript-common-types` já implementado e validado
- Convenções de CI aprendidas na Fase 04 (ver resultado)
- `defaultBase` é `develop` (não `main`)

**DESAFIO**

Implementar o pacote `@bhs-dev/typescript-common-errors` — erros customizados com factories HTTP.

### Escopo do Pacote

Conforme MONOREPO_PROPOSE.md, `typescript-common-errors` contém:

**Classe `CustomError` (extrair de `ts-express-app/src/common/customErrors.common.ts`):**
- Herda de `Error`
- Propriedades: `status`, `code`, `details`, `isOperational`, `exposeMessage`
- Constructor: `(status, code, message, opts?: CustomErrorOptions)`
- Factory methods estáticos:
  - `badRequest(message?, code?, opts?)` → 400
  - `apiModuleNotRecognized(message?, code?, opts?)` → 400
  - `unauthorized(message?, code?, opts?)` → 401
  - `forbidden(message?, code?, opts?)` → 403
  - `notFound(message?, code?, opts?)` → 404
  - `conflict(message?, code?, opts?)` → 409
  - `unprocessable(message?, code?, opts?)` → 422
  - `tooManyRequests(message?, code?, opts?)` → 429
  - `internal(message?, code?, opts?)` → 500

**Dependência interna:**
- `@bhs-dev/typescript-common-types` — importa `CustomErrorOptions`

### Entregáveis

1. **Gerar o pacote** via `nx g @nx/js:lib` conforme runbook
2. **`packages/typescript-common-errors/package.json`:**
   - name: `@bhs-dev/typescript-common-errors`
   - version: `0.0.1`
   - dependencies: `@bhs-dev/typescript-common-types`
   - Zero peerDependencies (não usa express, tsyringe, etc.)
   - `publishConfig.access: "public"`, `engines.node >= 22`
3. **`packages/typescript-common-errors/src/`** — estrutura:
   - `errors/custom-error.ts` — classe CustomError com factories
   - `index.ts` — barrel export público
4. **`packages/typescript-common-errors/tsconfig.json`** e `tsconfig.spec.json`
5. **`packages/typescript-common-errors/jest.config.ts`**
6. **Testes unitários** (portar de `ts-express-app/tests/common/customErrors.common.spec.ts`):
   - Constructor cria erro com propriedades corretas
   - `opts.details`, `opts.exposeMessage`, `opts.cause` funcionam
   - Cada factory method retorna status/code/message corretos
   - `instanceof Error` e `instanceof CustomError` validados
   - Barrel export contém todos os exports esperados
7. **Path alias** em `tsconfig.base.json` raiz
8. **Validar fluxo completo:**
   - `nx run @bhs-dev/typescript-common-errors:build` ✅
   - `nx run @bhs-dev/typescript-common-errors:test` ✅
   - `nx run @bhs-dev/typescript-common-errors:lint` ✅
   - `nx graph` mostra dependência types → errors correta

### NÃO fazer nesta fase

- Não criar nenhum outro pacote
- Não incluir `EnvironmentError` / `EnvVarsNotFoundError` / `HttpError` / `HttpTimeoutError` (esses já estão em `typescript-common-types`)
- Não modificar `ts-express-app` para consumir o pacote
- Não fazer push nem publish — apenas validar localmente

**PRINCÍPIOS DE TRABALHO**

- Preservar padrões do ts-express-app (extrair código "as-is")
- Manter compatibilidade com o grafo de dependências do MONOREPO_PROPOSE.md
- Reusar `CustomErrorOptions` de `@bhs-dev/typescript-common-types` (não duplicar)
- Usar o pacote `typescript-common-types` já implementado como referência de estrutura
- Idioma: PT-BR para docs, inglês para código
- Antes de gerar arquivos em massa, apresentar plano de execução e aguardar OK
- Aplicar convenções aprendidas: nome Nx no version plan, `--first-release` se necessário, etc.

**COMECE POR**

1. Ler todos os documentos listados acima
2. Apresentar em tela o seu entendimento do escopo exato do pacote (máx 15 linhas)
3. Apresentar plano de execução em tópicos ordenados
4. Aguardar meu OK antes de criar/modificar qualquer arquivo
```

---

## Critérios de Aceite

- [x] Pacote gera `dist/` com `.js` e `.d.ts` corretos
- [x] Testes passam com cobertura aderente aos thresholds
- [x] Lint sem erros
- [x] `nx graph` mostra dependência `typescript-common-types` → `typescript-common-errors`
- [x] Barrel export contém `CustomError` e todas as factories
- [x] `package.json` com dependency em `@bhs-dev/typescript-common-types`
- [x] Nenhum import de implementação externa (apenas types do pacote irmão)
- [x] `CustomErrorOptions` é importado de `@bhs-dev/typescript-common-types`, não redefinido

## Situação Final da Phase

- [x] Implementação do pacote concluída
- [x] Validação local de build, test, lint e coverage concluída
- [x] CI de pull request estabilizado (`npm ci` + comentário de coverage)
- [ ] Publicação/release do pacote concluída

**Pendência remanescente:** diagnosticar e corrigir definitivamente a divergência entre `git tag`, `version plan`, versão publicada de `typescript-common-types` no npm e range de dependência interna consumido por `typescript-common-errors`.
