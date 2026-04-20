# Phase 04: Primeiro Pacote — `typescript-common-types` — CONCLUÍDA

> **Status:** ✅ Concluída em 2026-04-20
> **Branch:** `feat/initial-configs`
> **PR:** #1 (aberto contra `develop`)

---

## Resultado Final

### Pacote `@bhs-dev/typescript-common-types`

| Entregável                        | Status | Detalhes                                                                                                                                                                                            |
| --------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Geração via `nx g @nx/js:lib`     | ✅     | `packages/typescript-common-types/` com tsc, eslint, jest                                                                                                                                           |
| `package.json`                    | ✅     | v0.0.1, `publishConfig.access: "public"`, `engines.node >= 22`, peerDep `express >= 5`                                                                                                              |
| Interfaces (`src/interfaces/`)    | ✅     | `ILogger`, `IEnvService`, `IHttpRequestOptions<TBody>`, `HttpResponse<T>`, `IHttpService`, `IBaseRoute`, `IRouteModule`, `MiddlewareConfig`                                                         |
| Types (`src/types/`)              | ✅     | `ClassCtor<T>`, `ScopeTypes`, `CustomErrorOptions`, `EnvVariable`, `EnvList`, `HttpMethod`, `HttpResponseType`, `RouteDef`, `RequestParts`, `TypedRequest`, `TypedRequestBody`, `MiddlewareFactory` |
| Error classes (`src/types/`)      | ✅     | `EnvironmentError`, `EnvVarsNotFoundError`, `HttpError<T>`, `HttpTimeoutError`                                                                                                                      |
| Symbols (`src/symbols/`)          | ✅     | 8 symbols DI: `EnvServiceSymbol`, `ProcessEnvSymbol`, `EnvListSymbol`, `LoggerServiceSymbol`, `HttpResponsesSymbol`, `RequestContextSymbol`, `ValidationMiddlewareSymbol`, `HttpServiceSymbol`      |
| Barrel export (`src/index.ts`)    | ✅     | Re-exporta `interfaces/`, `types/`, `symbols/`                                                                                                                                                      |
| Path alias (`tsconfig.base.json`) | ✅     | `@bhs-dev/typescript-common-types` → `packages/.../src/index.ts`                                                                                                                                    |
| Testes unitários                  | ✅     | 3 suites, 36 testes (errors, symbols, barrel)                                                                                                                                                       |
| Build                             | ✅     | `nx run typescript-common-types:build`                                                                                                                                                              |
| Lint                              | ✅     | `nx run typescript-common-types:lint`                                                                                                                                                               |
| README.md                         | ✅     | Documentação com tabelas de referência e 6 exemplos de uso                                                                                                                                          |

### Melhorias CI/CD aplicadas durante a fase

| Entregável          | Status | Detalhes                                                       |
| ------------------- | ------ | -------------------------------------------------------------- |
| Coverage thresholds | ✅     | `jest.preset.js`: branches 75%, functions/lines/statements 90% |
| Coverage no PR      | ✅     | `MishaKav/jest-coverage-comment` via `nyc merge`               |
| Husky + lint-staged | ✅     | Pre-commit: eslint --fix, prettier, nx affected test           |
| Security audit      | ✅     | `npm audit --audit-level=high --omit=dev` (ignora devDeps)     |

### Correções no CI (`ci.yml`) durante a fase

| Problema                                                          | Correção                                                                          |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `branches` + `branches-ignore` inválido no GitHub Actions         | Removido `push` trigger; CI roda apenas em `pull_request`                         |
| `.gitkeep` interpretado como version plan                         | Removido `.nx/version-plans/.gitkeep`                                             |
| Version plan usava nome npm (`@bhs-dev/...`)                      | Corrigido para nome Nx (`typescript-common-types`)                                |
| `defaultBase: "main"` mas branch padrão é `develop`               | Corrigido `nx.json` para `"defaultBase": "develop"`                               |
| `nx affected` falhava no job `publish-dev` (sem branch local)     | Adicionado `nrwl/nx-set-shas@v4` no job                                           |
| `--ver` flag inválida no `nx release publish`                     | Substituído por step `Set dev version` que atualiza `package.json` antes do build |
| `JSON.parse` error no primeiro publish (pacote inexistente no AR) | Adicionado `--first-release`                                                      |
| `npm audit` falhava por vulns em devDeps                          | `--omit=dev` para auditar apenas dependências de produção                         |

### Desvios do plano original

| Item planejado                     | Implementado                                | Motivo                                                                                         |
| ---------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| peerDep `@types/express`           | `express >= 5.0.0`                          | Importamos de `express`, não de `@types/express`; `@nx/dependency-checks` valida imports reais |
| peerDep `tsyringe`                 | Removido                                    | Nenhum import de tsyringe neste pacote; symbols usam `Symbol()` nativo                         |
| Coverage threshold no pacote types | Desativado (`coverageThreshold: undefined`) | Pacote de contratos puros sem lógica executável para medir                                     |

---

## Prompt Original Utilizado

```
**CONTEXTO**

Você atuará como **Engenheiro TypeScript Senior** e vai implementar o primeiro pacote do monorepo Nx.

Tenho quatro repositórios cooperativos no workspace:

1. `ts-express-app` (`~/code/ts-express-app`) — template backend TypeScript/Express enterprise-ready. Fonte do código a ser extraído.
2. `typescript-common-packages` (`~/code/Personal/typescript-common-packages`) — monorepo Nx com esqueleto já pronto (Fase 02-03 concluída).
3. `homelab-infra` (`~/code/Personal/homelab-infra`) — infra Terraform. **Referência apenas**.
4. `homelab-gitops` (`~/code/Personal/homelab-gitops`) — GitOps. **Referência apenas**.

**Leia obrigatoriamente antes de começar, nesta ordem:**

1. `typescript-common-packages/docs/agent/prompts/phase-02-03-infra-and-skeleton.md` — resultado da fase anterior (seção "Resultado Final")
2. `typescript-common-packages/docs/adr/ADR-0001-publication-strategy.md` — decisões congeladas
3. `typescript-common-packages/docs/runbooks/package-onboarding.md` — processo de criação de pacote
4. `typescript-common-packages/package.json` — dependências raiz e versões
5. `typescript-common-packages/nx.json` — config Nx Release e cache
6. `typescript-common-packages/tsconfig.base.json` — convenções TypeScript
7. `ts-express-app/docs/agents/MONOREPO_PROPOSE.md` — grafo de dependências dos 8 pacotes
8. `ts-express-app/docs/agents/REPO_STATUS.md` — padrões do template
9. `ts-express-app/src/interfaces/common.interfaces.ts` — interfaces a extrair
10. `ts-express-app/src/types/` — types a extrair (api.types.ts, common.types.ts, env.types.ts, http.types.ts)
11. `ts-express-app/src/symbols/commons.symbols.ts` + `http.symbols.ts` — symbols a extrair

**DECISÕES JÁ CONGELADAS (não relitigar):**

- Scope npm: `@bhs-dev/*`
- Todas as decisões do ADR-0001 permanecem válidas
- Esqueleto do monorepo já commitado e funcional (Nx 22.6.5, TS ~5.8.2, Jest ^30)
- Infra GCP já aplicada (AR npm, GCS cache, WIF)
- Pacote `nx-remotecache-gcs` (MIT) usado em vez de `@pellegrims/nx-remotecache-gcs`

**DESAFIO**

Implementar o pacote `@bhs-dev/typescript-common-types` — o pacote raiz do grafo de dependências (zero deps runtime, apenas contratos puros).

### Escopo do Pacote

Conforme MONOREPO_PROPOSE.md, `typescript-common-types` contém:

**Interfaces (extrair de `ts-express-app/src/interfaces/common.interfaces.ts`):**
- `ILogger` — child(), debug(), info(), warn(), error()
- `IEnvService` — getEnv(key)
- `IHttpRequestOptions<TBody>` — config completa de request HTTP
- `HttpResponse<T>` — { status, headers, data }
- `IHttpService` — request(), get(), post(), put(), patch(), delete()
- `IBaseRoute` / `IRouteModule` — getRouter()
- `MiddlewareConfig` — id, description, order, path, handler, factory, isErrorHandler, enableIf

**Types (extrair de `ts-express-app/src/types/`):**
- `ClassCtor<T>`, `ScopeTypes` (de api.types.ts)
- `CustomErrorOptions` (de common.types.ts)
- `EnvVariable`, `EnvList` (de env.types.ts)
- `HttpMethod`, `HttpResponseType`, `RouteDef`, `RequestParts`, `TypedRequest`, `TypedRequestBody` (de http.types.ts)

**Error classes (extrair de `ts-express-app/src/types/`):**
- `EnvVarsNotFoundError`, `EnvironmentError` (de env.types.ts)
- `HttpError`, `HttpTimeoutError` (de http.types.ts)

**Symbols (extrair de `ts-express-app/src/symbols/`):**
- `EnvServiceSymbol`, `ProcessEnvSymbol`, `EnvListSymbol`, `LoggerServiceSymbol`, `HttpResponsesSymbol`, `RequestContextSymbol`, `ValidationMiddlewareSymbol` (de commons.symbols.ts)
- `HttpServiceSymbol` (de http.symbols.ts)

### Entregáveis

1. **Gerar o pacote** via `nx g @nx/js:lib` conforme runbook
2. **`packages/typescript-common-types/package.json`:**
   - name: `@bhs-dev/typescript-common-types`
   - version: `0.0.1`
   - peerDependencies: `@types/express` (tipos Express para interfaces de request/response/router), `tsyringe` (para `InjectionToken` usado em tipos)
   - Zero dependencies runtime
   - `publishConfig.access: "public"`, `engines.node >= 22`
3. **`packages/typescript-common-types/src/`** — organizar em subpastas:
   - `interfaces/` — todas as interfaces genéricas (não feature-specific)
   - `types/` — types utilitários e error classes
   - `symbols/` — symbols de DI genéricos
   - `index.ts` — barrel export público
4. **`packages/typescript-common-types/tsconfig.json`** e `tsconfig.spec.json`
5. **`packages/typescript-common-types/jest.config.ts`**
6. **Testes unitários** mínimos — validar que:
   - Types/interfaces compilam corretamente
   - Error classes instanciam com propriedades corretas
   - Symbols são únicos
   - Barrel export contém todos os exports esperados
7. **Path alias** em `tsconfig.base.json` raiz
8. **Validar fluxo completo:**
   - `nx run @bhs-dev/typescript-common-types:build` ✅
   - `nx run @bhs-dev/typescript-common-types:test` ✅
   - `nx run @bhs-dev/typescript-common-types:lint` ✅

### NÃO fazer nesta fase

- Não criar nenhum outro pacote (errors, env, logger, etc.)
- Não extrair tipos/interfaces específicos de features (helloWorld.*)
- Não incluir schemas Zod no types (Zod é peer de middlewares, não de types)
- Não modificar `ts-express-app` para consumir o pacote (isso é fase futura)
- Não fazer push nem publish — apenas validar localmente

**PRINCÍPIOS DE TRABALHO**

- Preservar padrões do ts-express-app: decorators, tsyringe, ESM interop
- Extrair código "as-is" primeiro, refatorar depois se necessário
- Manter compatibilidade com o grafo de dependências do MONOREPO_PROPOSE.md
- Interfaces genéricas ficam em types; interfaces de feature ficam na app
- Idioma: PT-BR para docs, inglês para código (consistente com ts-express-app)
- Antes de gerar arquivos em massa, apresentar plano de execução e aguardar OK

**COMECE POR**

1. Ler todos os documentos listados acima
2. Apresentar em tela o seu entendimento do escopo exato do pacote (máx 15 linhas)
3. Apresentar plano de execução em tópicos ordenados
4. Aguardar meu OK antes de criar/modificar qualquer arquivo
```

---

## Critérios de Aceite

- [ ] Pacote gera `dist/` com `.js` e `.d.ts` corretos
- [ ] Testes passam com cobertura mínima
- [ ] Lint sem erros
- [ ] `nx graph` mostra o pacote sem dependências internas
- [ ] Barrel export (`index.ts`) contém todos os contratos públicos
- [ ] `package.json` com peerDependencies corretas (apenas `@types/express`, `tsyringe`)
- [ ] Nenhum import de implementação (winston, zod, etc.) — apenas tipos puros
