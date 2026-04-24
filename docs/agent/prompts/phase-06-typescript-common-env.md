# Phase 06: Terceiro Pacote — `typescript-common-env` — IMPLEMENTAÇÃO CONCLUÍDA

> **Status:** ✅ Implementação concluída em 2026-04-22 (branch `feat/common-env`)
> **Publicação:** ⏳ Pendente — a fazer via release branch dedicada `releases/typescript-common-env/v1.0.0` (modelo ADR-0001 Addendum 2026-04-22)
> **Objetivo:** Criar o pacote `@bhs-dev/typescript-common-env` — serviço de variáveis de ambiente com validação e preenchimento de defaults.
> **Pré-requisito:** Phase 05 concluída (`typescript-common-errors` implementado e validado — publicado em `1.0.0`).

---

## Resultado Final

### Pacote `@bhs-dev/typescript-common-env`

| Entregável                    | Status | Detalhes                                                                                                                                                                     |
| ----------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Geração via `nx g @nx/js:lib` | ✅     | `packages/typescript-common-env/` com `tsc`, `eslint` e `jest`                                                                                                               |
| `package.json`                | ✅     | `0.0.1`, `publishConfig.access: "public"`, `engines.node >= 22`, dep em `@bhs-dev/typescript-common-types@^1.0.0`, peers em `tsyringe >=4.10.0` e `reflect-metadata >=0.2.0` |
| Implementação `EnvService`    | ✅     | `src/services/env-service.ts` portado de `ts-express-app/src/common/env.common.ts` preservando `@injectable()`, injeção via `tsyringe` e regras de validação                 |
| Barrel export                 | ✅     | `src/services/index.ts` + `src/index.ts` reexportando `EnvService`                                                                                                           |
| Reuso de contratos de `types` | ✅     | `IEnvService`, `EnvList`, `EnvVariable`, `EnvVarsNotFoundError`, `EnvListSymbol`, `ProcessEnvSymbol` importados de `@bhs-dev/typescript-common-types`, sem redefinição       |
| Testes unitários              | ✅     | 2 suites, 6 testes (`env-service.spec.ts` com 5 casos + `barrel.spec.ts` com 1 caso)                                                                                         |
| Path alias raiz               | ✅     | `@bhs-dev/typescript-common-env` apontando para `packages/typescript-common-env/src/index.ts` (adicionado automaticamente pelo generator)                                    |
| README do pacote              | ✅     | PT-BR com instalação, peers, tabela de comportamento e exemplos de registro DI + resolução                                                                                   |
| Version plan                  | ✅     | `.nx/version-plans/typescript-common-env-initial.md` com nome Nx `typescript-common-env` e bump `major`                                                                      |
| Build                         | ✅     | `nx run typescript-common-env:build`                                                                                                                                         |
| Test                          | ✅     | `nx run typescript-common-env:test` (2 suites, 6 testes)                                                                                                                     |
| Lint                          | ✅     | `nx run typescript-common-env:lint`                                                                                                                                          |
| `nx release plan:check`       | ✅     | Plan íntegro, bump `major` reconhecido                                                                                                                                       |
| `nx release version` dry-run  | ✅     | Com `1.0.0 --first-release`, bumpa apenas `env`; `dist/packages/typescript-common-env/package.json` com dep `^1.0.0` em types; sem toque em types/errors                     |
| Grafo Nx                      | ✅     | Dependência estática `typescript-common-env` → `typescript-common-types` confirmada                                                                                          |

### Desvios intencionais (registrados conforme princípios de trabalho)

1. **Cast `as string` no `getEnv`**
   - `NodeJS.ProcessEnv[key]` é `string | undefined`, mas a interface `IEnvService.getEnv(key)` declara retorno `string`
   - Com `strict: true` + `noPropertyAccessFromIndexSignature: true` herdados, `return this.env[key]` não compila
   - Aplicado `return this.env[key] as string` conforme orientação do prompt. Contrato da interface é mantido; em runtime, chaves não declaradas na `EnvList` e ausentes em `process.env` retornam `undefined` (documentado no README)

2. **`reflect-metadata` adicionado como `peerDependency`**
   - O prompt listava apenas `tsyringe` como peer. O `@nx/dependency-checks` falhou o lint porque `import 'reflect-metadata'` aparece no código/testes
   - `reflect-metadata` é pré-requisito de runtime do `tsyringe`, então declarar como peer (`>=0.2.0`) é consistente com o padrão do `ts-express-app` e com a prescrição de importar `reflect-metadata` uma única vez no entry point do consumidor

3. **Testes simplificados para ESM imports**
   - O spec original em `ts-express-app/tests/common/env.common.spec.ts` usava `require` dinâmico com `jest.resetModules()` para evitar colisão entre `src/common` e `src/types` naquele repo
   - No monorepo os contratos vivem em pacote separado (`@bhs-dev/typescript-common-types`), então não há colisão — `import` ESM direto
   - Cobertura equivalente: defaults, não-sobrescrita, `EnvVarsNotFoundError` com `instanceof`, opcional sem default ignorado, `getEnv` exato

4. **Primeiro release `1.0.0` (não `0.1.0`)**
   - Version plan com bump `major` conforme prompt, alinhado ao padrão adotado em `typescript-common-types@1.0.0` e `typescript-common-errors@1.0.0`

### Validações Executadas

```bash
npx nx reset
npx nx run typescript-common-env:build   # ✅
npx nx run typescript-common-env:test    # ✅ 2 suites, 6 testes
npx nx run typescript-common-env:lint    # ✅
CI=1 npx nx release plan:check --verbose # ✅ plan íntegro
CI=1 npx nx release version 1.0.0 --projects=typescript-common-env --first-release --dry-run
# ✅ dist/packages/typescript-common-env/package.json → version 1.0.0, dep em types ^1.0.0
npx nx graph --file=tmp/graph.json
# ✅ aresta typescript-common-env → typescript-common-types (static)
```

### Próxima etapa

Publicação `@bhs-dev/typescript-common-env@1.0.0` via release branch dedicada (modelo ADR-0001 Addendum 2026-04-22), analogamente ao que foi feito em `phase-05c`.

---

## Prompt para Novo Chat

````
**CONTEXTO**

Você atuará como **Engenheiro TypeScript Senior** e vai implementar o terceiro pacote do monorepo Nx.

Tenho quatro repositórios cooperativos no workspace:

1. `ts-express-app` (`~/code/ts-express-app`) — template backend TypeScript/Express enterprise-ready. Fonte do código a ser extraído.
2. `typescript-common-packages` (`~/code/Personal/typescript-common-packages`) — monorepo Nx com os pacotes `typescript-common-types` e `typescript-common-errors` já implementados.
3. `homelab-infra` (`~/code/Personal/homelab-infra`) — infra Terraform. **Referência apenas**.
4. `homelab-gitops` (`~/code/Personal/homelab-gitops`) — GitOps. **Referência apenas**.

**Leia obrigatoriamente antes de começar, nesta ordem:**

1. `typescript-common-packages/docs/agent/prompts/phase-05-typescript-common-errors.md` — resultado da fase anterior (seção "Resultado Final")
2. `typescript-common-packages/docs/adr/ADR-0001-publication-strategy.md` — decisões congeladas
3. `typescript-common-packages/docs/runbooks/package-onboarding.md` — processo de criação de pacote
4. `typescript-common-packages/package.json` — dependências raiz e versões
5. `typescript-common-packages/nx.json` — config Nx Release e cache
6. `typescript-common-packages/tsconfig.base.json` — convenções TypeScript e path aliases existentes
7. `typescript-common-packages/packages/typescript-common-types/` — contratos já implementados (`IEnvService`, `EnvList`, `EnvVariable`, `EnvVarsNotFoundError`, `EnvListSymbol`, `ProcessEnvSymbol`)
8. `typescript-common-packages/packages/typescript-common-errors/` — referência de estrutura, README e version plan usados na fase anterior
9. `ts-express-app/docs/agents/MONOREPO_PROPOSE.md` — grafo de dependências dos 8 pacotes
10. `ts-express-app/src/common/env.common.ts` — classe `EnvService` a extrair
11. `ts-express-app/tests/common/env.common.spec.ts` — testes a portar
12. `ts-express-app/src/container.ts` — referência de registro DI e uso dos symbols já extraídos

**DECISÕES JÁ CONGELADAS (não relitigar):**

- Scope npm: `@bhs-dev/*`
- Todas as decisões do ADR-0001 permanecem válidas
- Esqueleto do monorepo funcional (Nx 22.6.5, TS ~5.8.2, Jest ^30)
- Infra GCP já aplicada (AR npm, GCS cache, WIF)
- Pacotes `typescript-common-types` e `typescript-common-errors` já implementados e validados
- `defaultBase` é `develop` (não `main`)
- Version plans usam o **nome Nx do projeto** (não o nome npm do pacote)
- O padrão atual do monorepo usa `jest.config.cts`
- README específico do pacote e version plan fazem parte do fechamento esperado da fase

**DESAFIO**

Implementar o pacote `@bhs-dev/typescript-common-env` — serviço de variáveis de ambiente com validação.

### Escopo do Pacote

Conforme MONOREPO_PROPOSE.md, `typescript-common-env` contém:

**Classe `EnvService` (extrair de `ts-express-app/src/common/env.common.ts`):**
- Decorada com `@injectable()`
- Implementa `IEnvService`
- Constructor com injeção via `tsyringe`:
  - `@inject(ProcessEnvSymbol) private readonly env: NodeJS.ProcessEnv`
  - `@inject(EnvListSymbol) private readonly envList: EnvList`
- Chama `loadEnvVariables()` no constructor
- `loadEnvVariables()` deve:
  - preservar valores já existentes em `process.env`
  - preencher `default` quando a variável não existir
  - ignorar variáveis opcionais sem default
  - acumular variáveis obrigatórias ausentes e lançar `EnvVarsNotFoundError`
- Método público `getEnv(key: string): string`

**Dependências internas e peers:**
- `@bhs-dev/typescript-common-types` — importa `IEnvService`, `EnvList`, `EnvVariable`, `EnvVarsNotFoundError`, `EnvListSymbol`, `ProcessEnvSymbol`
- `tsyringe` — `@injectable` e `@inject`

### Entregáveis

1. **Gerar o pacote** via `nx g @nx/js:lib` conforme runbook
2. **`packages/typescript-common-env/package.json`:**
   - name: `@bhs-dev/typescript-common-env`
   - version: `0.0.1` (o Nx bumpa para `1.0.0` via version plan `major` no release)
   - dependencies: `@bhs-dev/typescript-common-types`
   - peerDependencies: `tsyringe >= 4.10.0`
   - nenhum peer adicional (`express`, `zod`, etc.)
   - `publishConfig.access: "public"`, `engines.node >= 22`
3. **`packages/typescript-common-env/src/`** — estrutura:
   - `services/env-service.ts` — classe `EnvService`
   - `services/index.ts` — barrel interno
   - `index.ts` — barrel export público
   - **Atenção:** o método `getEnv` no fonte original retorna `this.env[key]` que é `string | undefined`, mas a interface `IEnvService` declara `getEnv(key: string): string`. Com `strict: true` + `noPropertyAccessFromIndexSignature: true` (herdado do tsconfig), o build vai falhar. Usar `return this.env[key] as string` e registrar como desvio intencional no resultado final.
   - **Atenção:** `@injectable()` e `@inject()` de `tsyringe` exigem `reflect-metadata` em runtime. Adicionar `import 'reflect-metadata'` no topo de `env-service.ts` (ou garantir que o arquivo de setup do Jest o importe antes de qualquer teste).
4. **`packages/typescript-common-env/tsconfig.json`**, `tsconfig.lib.json` e `tsconfig.spec.json`
5. **`packages/typescript-common-env/jest.config.cts`**
6. **Testes unitários** (portar de `ts-express-app/tests/common/env.common.spec.ts`):
   - preenche defaults quando variáveis não existem
   - não sobrescreve valores existentes no env
   - lança `EnvVarsNotFoundError` quando requeridas faltam e não há default
   - `getEnv()` retorna exatamente o valor do env injetado
   - `instanceof EnvVarsNotFoundError` validado
   - barrel export contém `EnvService`
   - **Obrigatório:** adicionar `import 'reflect-metadata'` no topo do arquivo de spec (antes de qualquer import de `tsyringe` ou `EnvService`). Sem isso, Jest falha com `Reflect.metadata is not a function`.
7. **Path alias** em `tsconfig.base.json` raiz
8. **README do pacote** com instalação, peer dependency, comportamento de defaults/validação e exemplos de uso
9. **Version plan** em `.nx/version-plans/typescript-common-env-initial.md` com bump `major` (para o primeiro release chegar em `1.0.0`). O arquivo `.nx/version-plans/typescript-common-errors-initial.md` foi consumido pelo `nx release` e não existe mais — usar o formato abaixo diretamente:
   ```md
   ---
   typescript-common-env: major
   ---

   Primeiro release de @bhs-dev/typescript-common-env — serviço de variáveis de ambiente com validação e preenchimento de defaults, extraído de ts-express-app.
````

**Atenção:** usar o **nome Nx** do projeto (`typescript-common-env`), não o nome npm (`@bhs-dev/typescript-common-env`). O README em `.nx/version-plans/README.md` mostra o formato com nome npm por inconsistência de documentação — a prática correta, validada nas fases anteriores, é o nome Nx. 10. **Validar fluxo completo:**

- `nx run typescript-common-env:build` ✅
- `nx run typescript-common-env:test` ✅
- `nx run typescript-common-env:lint` ✅
- `nx release plan:check` ✅
- `nx graph` mostra dependência `typescript-common-types` → `typescript-common-env`

### NÃO fazer nesta fase

- Não criar nenhum outro pacote
- Não duplicar interfaces, types, errors ou symbols que já pertencem a `typescript-common-types`
- Não mover `EnvServiceSymbol` para este pacote nem redefinir tokens DI
- Não modificar `ts-express-app` para consumir o pacote
- Não alterar `container.ts` da aplicação além de usá-lo como referência
- Não fazer push nem publish — apenas validar localmente

**PRINCÍPIOS DE TRABALHO**

- Preservar padrões do ts-express-app: decorators, `tsyringe`, comportamento de validação e ordem das regras
- Extrair código "as-is" primeiro; refatorar só se necessário para compatibilidade com o monorepo
- Reusar contratos de `@bhs-dev/typescript-common-types` (não duplicar)
- Usar `typescript-common-errors` como referência de estrutura, testes, README e version plan
- Idioma: PT-BR para docs, inglês para código
- Antes de gerar arquivos em massa, apresentar plano de execução e aguardar OK
- Se houver divergência entre o prompt e a fonte real do repositório, tratar o código atual como fonte de verdade e registrar o desvio no resultado final

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
- [ ] `nx graph` mostra dependência `typescript-common-types` → `typescript-common-env`
- [ ] `package.json` com dependency em `@bhs-dev/typescript-common-types` e peerDependency em `tsyringe`
- [ ] Nenhum type/symbol/error é redefinido localmente
- [ ] `EnvVarsNotFoundError`, `EnvList`, `EnvVariable`, `IEnvService`, `EnvListSymbol` e `ProcessEnvSymbol` são importados de `@bhs-dev/typescript-common-types`
- [ ] Barrel export contém `EnvService`
- [ ] README e version plan do pacote foram criados
```
