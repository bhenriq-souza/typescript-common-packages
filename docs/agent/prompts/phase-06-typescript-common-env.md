# Phase 06: Terceiro Pacote — `typescript-common-env`

> **Objetivo:** Criar o pacote `@bhs-dev/typescript-common-env` — serviço de variáveis de ambiente com validação e preenchimento de defaults.

> **Pré-requisito:** Phase 05 concluída (`typescript-common-errors` implementado e validado).

---

## Prompt para Novo Chat

```
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
   - version: `0.0.1`
   - dependencies: `@bhs-dev/typescript-common-types`
   - peerDependencies: `tsyringe >= 4.10.0`
   - nenhum peer adicional (`express`, `zod`, etc.)
   - `publishConfig.access: "public"`, `engines.node >= 22`
3. **`packages/typescript-common-env/src/`** — estrutura:
   - `services/env-service.ts` — classe `EnvService`
   - `services/index.ts` — barrel interno
   - `index.ts` — barrel export público
4. **`packages/typescript-common-env/tsconfig.json`**, `tsconfig.lib.json` e `tsconfig.spec.json`
5. **`packages/typescript-common-env/jest.config.cts`**
6. **Testes unitários** (portar de `ts-express-app/tests/common/env.common.spec.ts`):
   - preenche defaults quando variáveis não existem
   - não sobrescreve valores existentes no env
   - lança `EnvVarsNotFoundError` quando requeridas faltam e não há default
   - `getEnv()` retorna exatamente o valor do env injetado
   - `instanceof EnvVarsNotFoundError` validado
   - barrel export contém `EnvService`
7. **Path alias** em `tsconfig.base.json` raiz
8. **README do pacote** com instalação, peer dependency, comportamento de defaults/validação e exemplos de uso
9. **Version plan** em `.nx/version-plans/typescript-common-env-initial.md` usando o nome Nx `typescript-common-env`
10. **Validar fluxo completo:**
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
