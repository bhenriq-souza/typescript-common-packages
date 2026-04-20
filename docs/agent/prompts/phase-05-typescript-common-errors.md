# Phase 05: Segundo Pacote — `typescript-common-errors`

> **Objetivo:** Criar o pacote `@bhs-dev/typescript-common-errors` — erros customizados com factories HTTP, segundo pacote do grafo de dependências.
> **Pré-requisito:** Phase 04 concluída (`typescript-common-types` implementado e validado).

---

## Prompt para Novo Chat

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

- [ ] Pacote gera `dist/` com `.js` e `.d.ts` corretos
- [ ] Testes passam com cobertura aderente aos thresholds
- [ ] Lint sem erros
- [ ] `nx graph` mostra dependência `typescript-common-types` → `typescript-common-errors`
- [ ] Barrel export contém `CustomError` e todas as factories
- [ ] `package.json` com dependency em `@bhs-dev/typescript-common-types`
- [ ] Nenhum import de implementação externa (apenas types do pacote irmão)
- [ ] `CustomErrorOptions` é importado de `@bhs-dev/typescript-common-types`, não redefinido
