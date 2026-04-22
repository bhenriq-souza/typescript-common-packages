# Phase 05b: Reconciliação de Release — `typescript-common-errors` / `typescript-common-types`

> **Objetivo:** entender definitivamente por que o `release.yml` falha ao publicar `typescript-common-errors` e propor uma correção definitiva para reconciliar `git tags`, `version plans`, manifests locais e versões publicadas no npm.
> **Status:** 🟢 Diagnosticada e implementada em 2026-04-22 — pendente publicação efetiva via release branch
> **Pré-requisito:** ler a pendência aberta documentada em `phase-05-typescript-common-errors.md`

---

## Resultado da Investigação

### Causa raiz confirmada

A combinação de três fatores produz o laço de falha do release:

1. **`currentVersionResolver: git-tag` sem ancoragem.** O publish inaugural de `typescript-common-types@0.0.1` (2026-04-20) **não criou tag git correspondente** (nem local, nem em `origin`). Sem tag, o resolver caía no fallback `disk` e lia `0.0.1` do manifest.
2. **Version-plan de `types` nunca foi consumido.** O arquivo `.nx/version-plans/typescript-common-types-initial.md` permaneceu presente após o publish inaugural, com bump `minor`. A cada run, o `nx release` aplicava esse plano e bumpava in-memory para `0.1.0`, criando localmente a tag `typescript-common-types@0.1.0`.
3. **`preserveMatchingDependencyRanges: true` (default Nx 22.6.5).** Ao processar `errors`, o Nx detectava que `types` agora era `0.1.0` e tentava ampliar a dep de `^0.0.1` para `^0.1.0`. A flag bloqueava a widening, derrubava o workflow antes do `git push --follow-tags`, e o ciclo se repetia eternamente.

Evidências coletadas:

- `git tag -l` → vazio
- `git ls-remote --tags origin` → vazio
- `npm view @bhs-dev/typescript-common-types versions` → `["0.0.1"]`
- `npm view @bhs-dev/typescript-common-types dist-tags` → `{ next: '0.0.1', latest: '0.0.1' }`
- Plans de `types` e `errors` ambos presentes em `.nx/version-plans/`

### Decisão adotada — modelo de release por branch dedicada

Em vez de patch isolado, a investigação levou à reformulação do trigger de release. Detalhes completos no [Addendum 2026-04-22 do ADR-0001](../../adr/ADR-0001-publication-strategy.md#addendum-2026-04-22--reformulação-do-trigger-de-release-branch-dedicada).

Resumo:

- Trigger antigo (push em `develop`/`main`) substituído por push em `releases/<package>/v<version>`
- Cada release branch publica **um único pacote** com versão **explícita** derivada do nome da branch
- `dist-tag` derivada da versão (sem suffix → `latest`; com suffix `-<canal>.<n>` → `<canal>`)
- Branch `main` aposentada
- Cascatas inter-pacote viram branches sequenciais documentadas
- Auto back-merge PR para `develop` após publish

### Mudanças aplicadas neste fechamento

| Arquivo                                                | Mudança                                                                                 | Motivo                                                                     |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `nx.json`                                              | `release.version.preserveMatchingDependencyRanges: false` + `updateDependents: 'never'` | Quebra do laço de falha; release branch isolada por pacote                 |
| `.nx/version-plans/typescript-common-types-initial.md` | bump `minor` → `major`, corpo reescrito                                                 | Decisão de inaugurar 1.0.0 como marcador de API estável                    |
| `.github/workflows/release.yml`                        | Reescrito para o modelo de branch dedicada                                              | Implementa o ADR Addendum 2026-04-22                                       |
| `docs/adr/ADR-0001-publication-strategy.md`            | Addendum 2026-04-22                                                                     | Documenta a reformulação do trigger e supersede pontos da Decision §2 e §6 |

### Validação local executada

- `CI=1 npx nx release version 1.0.0 --projects=typescript-common-types --first-release --dry-run` → ✅ bumpa apenas `dist/packages/typescript-common-types/package.json` para `1.0.0`, ignora `errors`
- `CI=1 npx nx release changelog 1.0.0 --projects=typescript-common-types --first-release --dry-run` → ✅ gera changelog com seção "Breaking Changes" no `packages/typescript-common-types/CHANGELOG.md`
- `CI=1 npx nx release version 0.1.0 --projects=typescript-common-errors --first-release --dry-run` → ✅ bumpa apenas `errors` em isolamento, dep `^0.0.1` permanece intacta (confirma o modelo de cascata explícita)

### Sequência operacional para publish efetivo

1. Mergear o PR atual em `develop` — não dispara nenhum workflow (esperado)
2. Criar branch `releases/typescript-common-types/v1.0.0` a partir de `develop` e fazer push
3. Workflow `release.yml` valida, bumpa, publica `@bhs-dev/typescript-common-types@1.0.0` com dist-tag `latest`, abre back-merge PR para `develop`
4. Mergear o back-merge PR — propaga consumo do plan e changelog
5. Para `errors`: nova PR em `develop` atualizando dep range para `^1.0.0` + plan; depois `releases/typescript-common-errors/v0.1.0`

---

## Prompt para Novo Chat

````
**CONTEXTO**

Você atuará como **Engenheiro TypeScript Senior** focado em Nx Release, versionamento independente e publicação npm em monorepo.

Tenho quatro repositórios cooperativos no workspace:

1. `ts-express-app` (`~/code/ts-express-app`) — template backend TypeScript/Express enterprise-ready. Referência de origem do código.
2. `typescript-common-packages` (`~/code/Personal/typescript-common-packages`) — monorepo Nx onde a publicação do segundo pacote travou.
3. `homelab-infra` (`~/code/Personal/homelab-infra`) — infra Terraform. **Referência apenas**.
4. `homelab-gitops` (`~/code/Personal/homelab-gitops`) — GitOps. **Referência apenas**.

**Leia obrigatoriamente antes de começar, nesta ordem:**

1. `typescript-common-packages/docs/agent/prompts/phase-05-typescript-common-errors.md` — principalmente as seções:
   - `Pendência aberta de publicação`
   - `Tentativas de correção já realizadas neste chat`
   - `Situação Final da Phase`
2. `typescript-common-packages/docs/adr/ADR-0001-publication-strategy.md` — Addendum 2026-04-20 (primeiro publish)
3. `typescript-common-packages/.github/workflows/release.yml`
4. `typescript-common-packages/nx.json`
5. `typescript-common-packages/.nx/version-plans/typescript-common-types-initial.md`
6. `typescript-common-packages/.nx/version-plans/typescript-common-errors-initial.md`
7. `typescript-common-packages/packages/typescript-common-types/package.json`
8. `typescript-common-packages/packages/typescript-common-errors/package.json`
9. `typescript-common-packages/package-lock.json`

**FATOS JÁ CONFIRMADOS (não revalidar sem necessidade):**

- `@bhs-dev/typescript-common-types` está publicado no npm com versão `0.0.1`
- `typescript-common-errors` foi implementado e validado localmente
- `npm ci` do PR já foi corrigido com o lockfile adequado
- o comentário de coverage do PR já foi corrigido no `ci.yml`
- `nx release plan:check --verbose` passa localmente
- o erro atual está concentrado no `release.yml`, no step `Version, changelog, commit & tag`
- o log do release mostra `typescript-common-types` resolvido como `0.1.0` a partir da tag git `typescript-common-types@0.1.0`
- com `@bhs-dev/typescript-common-types: ^0.0.1` em `typescript-common-errors`, o release falha por `preserveMatchingDependencyRanges`
- com `@bhs-dev/typescript-common-types: ^0.1.0`, o `npm install` quebra porque `0.1.0` não existe publicado no npm

**PROBLEMA A INVESTIGAR**

Hoje existe uma divergência entre:

1. a versão publicada no npm de `@bhs-dev/typescript-common-types` (`0.0.1`)
2. a versão corrente resolvida pelo `nx release` a partir de git tag (`0.1.0`)
3. o range de dependência que `typescript-common-errors` pode declarar sem quebrar o install nem o release

O workflow de release falha com erro deste tipo:

```text
typescript-common-errors Applied semver relative bump "minor" ... to get new version 0.1.0
typescript-common-types Resolved the current version as 0.1.0 from git tag "typescript-common-types@0.1.0"
typescript-common-types No changes were detected within version plans
NX "preserveMatchingDependencyRanges" is enabled for "dependencies" and the new version "^0.1.0" is outside the current range for "@bhs-dev/typescript-common-types" in manifest "dist/packages/typescript-common-errors/package.json".
````

**O QUE EU QUERO COMO RESULTADO DESTE CHAT**

1. Explicação precisa da causa raiz
   - Por que o `nx release` resolve `typescript-common-types` como `0.1.0`
   - Se isso vem de tag local/remota, histórico de release, state drift ou configuração do Nx
   - Como isso pode coexistir com o npm registry ainda expondo só `0.0.1`

2. Diagnóstico definitivo do estado correto do sistema
   - Qual deve ser a versão "source of truth" de `typescript-common-types` agora
   - O que está errado hoje: tag, plan, manifest, workflow ou sequência de release

3. Solução definitiva recomendada
   - Ação exata para reconciliar o estado
   - Exemplo: ajustar/deletar tag? publicar a versão faltante? mudar configuração do `nx release`? alterar plans? ajustar strategy?
   - Prós/contras e riscos de cada alternativa, se houver mais de uma viável

4. Plano de execução mínimo e seguro
   - Ordem dos passos
   - Quais comandos rodar
   - Quais arquivos editar
   - Quais validações executar antes de fazer merge em `develop` ou `main`

5. Restrições importantes
   - Não proponha "gambiarra" que esconda o problema sem reconciliar o estado
   - Não mexa em `typescript-common-types/package.json` ou `typescript-common-errors/package.json` sem explicar por que isso é a consequência correta, e não apenas um workaround
   - Não assuma que npm registry e git tags estão consistentes — esse é justamente o ponto a investigar

**FORMA DE TRABALHO ESPERADA**

- Primeiro: leia os artefatos e explique a causa raiz em linguagem objetiva
- Segundo: proponha a solução definitiva e os tradeoffs
- Terceiro: só depois disso proponha mudanças concretas ou patch
- Se houver dúvida sobre estado remoto (tags, publish real, branch base), priorize investigação e evidência antes de editar arquivos

**COMECE POR**

1. Ler todos os arquivos listados acima
2. Resumir em até 15 linhas a divergência atual entre `git tags`, `npm registry`, manifests e `nx release`
3. Listar 2 a 4 hipóteses possíveis de causa raiz, ordenadas por probabilidade
4. Dizer quais evidências faltam para fechar o diagnóstico definitivo
5. Só então montar um plano de investigação/solução

```

---

## Resultado Esperado

- [x] Causa raiz identificada com evidências
- [x] Estratégia definitiva de reconciliação escolhida (modelo de release branch dedicada — ADR-0001 Addendum 2026-04-22)
- [x] Sequência de correção descrita passo a passo (ver "Sequência operacional para publish efetivo" acima)
- [ ] Pendência de publicação da Fase 05 resolvida (aguarda criação da branch `releases/typescript-common-types/v1.0.0` + back-merge + branch de `errors`)
```
