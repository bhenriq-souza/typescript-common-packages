# Phase 04b: Migração para Trusted Publisher (npm OIDC)

> **Status:** 📦 Arquivada em 2026-04-22 — diferida até o publish inaugural de todos os pacotes do monorepo
> **Motivo do arquivamento:** o Trusted Publisher do npm é configurado **por pacote** e a página de setup só existe após o primeiro publish de cada um (chicken-egg). Executar esta migração logo após o primeiro pacote obrigaria o ciclo "reativar `NPM_TOKEN` → publicar novo pacote → configurar Trusted Publisher → remover `NPM_TOKEN`" a cada phase subsequente. Decisão: manter `NPM_TOKEN` como mecanismo único até o publish inaugural do último pacote, e então executar esta phase uma única vez para todos.
> **Condição de retomada:** todos os pacotes previstos em [MONOREPO_PROPOSE.md](../../../../../ts-express-app/docs/agents/MONOREPO_PROPOSE.md) publicados ao menos uma vez no `registry.npmjs.org`. No plano atual: `types`, `errors`, `env`, `context`, `logger`, `http`, `express`, `middlewares`.
> **Pré-requisito original:** Phase 04 concluída (pacote `@bhs-dev/typescript-common-types@0.0.1` publicado) ✅
> **Referência:** [ADR-0001 §7 Autenticação](../../../adr/ADR-0001-publication-strategy.md#7-autenticação-sem-credenciais-estáticas) e [Addendum 2026-04-20](../../../adr/ADR-0001-publication-strategy.md#addendum-2026-04-20--primeira-publicação-e-desvios-observados) (D1)

---

## Nota para retomada

O plano abaixo foi escrito pressupondo migração **imediatamente após** o primeiro publish (apenas `@bhs-dev/typescript-common-types`). Ao retomar, considerar:

- **Passo 1 é por pacote:** repetir o cadastro de Trusted Publisher para cada pacote publicado. Avaliar se o npm já suporta configuração por scope — se sim, consolidar.
- **Passo 4 (remoção do secret) é o último ato:** manter `NPM_TOKEN` ativo até o último pacote ter Trusted Publisher configurado.
- **Passo 2 (ajuste do workflow):** revalidar o diff contra o `release.yml` vigente — pode ter evoluído.
- **`--first-release`:** já terá sido removido ao longo dos publishes intermediários; confirmar.

O restante (validação em `develop`, publish em `main`, revogação do Classic Automation Token, atualização do ADR) permanece aplicável.

---

## Objetivo

Eliminar o secret `NPM_TOKEN` do repositório e autenticar o publish no `registry.npmjs.org` via **OIDC Trusted Publisher**, restaurando a postura "zero credenciais estáticas" definida no ADR.

Resultado esperado no fim da fase:

- `NPM_TOKEN` **removido** de GitHub → Settings → Secrets and variables → Actions
- `.github/workflows/release.yml` **sem** referências a `NPM_TOKEN`, `NODE_AUTH_TOKEN`, nem step `Configure npm authentication`
- Release subsequente (version `0.0.2` ou `0.1.0`, conforme version plans) publicada com sucesso apenas via OIDC

---

## Por que só agora

O Trusted Publisher do npm exige que o pacote **já exista** no registry para ser configurado — a página de setup na UI (`npmjs.com → package → Settings → Trusted Publishers`) simplesmente não existe antes do primeiro publish. Com `@bhs-dev/typescript-common-types@0.0.1` agora publicado, o gargalo chicken-egg está resolvido e a migração pode ocorrer.

---

## Pré-checagens

Antes de iniciar, confirmar:

- [ ] `npm view @bhs-dev/typescript-common-types version` retorna ≥ `0.0.1` (o publish base existe)
- [ ] Existe pelo menos 1 version plan em `.nx/version-plans/` pronto para consumir na próxima release (assim é possível disparar um publish real para validar, não apenas dry-run)
- [ ] Branch `main` protegida com "Require pull request before merging" (para que a release rode a partir de um merge controlado)
- [ ] Usuário npm que é **owner** do scope `@bhs-dev` (ou do pacote) tem acesso ao painel de administração em `npmjs.com`

---

## Passo 1 — Configurar Trusted Publisher no npmjs.com

Na UI do npm (precisa estar logado como owner do pacote):

1. Navegar para `https://www.npmjs.com/package/@bhs-dev/typescript-common-types/access`
   - **Alternativa:** `npmjs.com` → avatar → Packages → clicar no pacote → aba **Settings**
2. Seção **Trusted Publisher** → **Add trusted publisher**
3. Preencher:

   | Campo                | Valor                                                               |
   | -------------------- | ------------------------------------------------------------------- |
   | Publisher            | `GitHub Actions`                                                    |
   | Organization or user | `bhs-dev` (ou o owner real do repo GitHub)                          |
   | Repository           | `typescript-common-packages`                                        |
   | Workflow filename    | `release.yml`                                                       |
   | Environment name     | _(deixar em branco — o workflow atual não usa GitHub Environments)_ |

4. **Save**

Após salvar, o pacote aparece listado com badge "Trusted Publisher configured". Nenhum token é gerado aqui — a autorização é derivada do token OIDC emitido pelo próprio GitHub em cada run.

**Nota:** se no futuro mais pacotes forem publicados (phase 05+), **cada pacote exige configuração separada** de Trusted Publisher. Alternativamente, quando o npm suportar trusted publisher por scope, consolidar — por ora, configurar por pacote.

---

## Passo 2 — Ajustar o workflow `release.yml`

Alvo: `.github/workflows/release.yml`. Dois blocos mudam.

### 2a. Manter o `setup-node` como está

```yaml
- name: Setup Node
  uses: actions/setup-node@v4
  with:
    node-version: ${{ env.NODE_VERSION }}
    cache: 'npm'
    registry-url: 'https://registry.npmjs.org'
```

`registry-url` continua necessário para que `setup-node` crie o `.npmrc` em `$RUNNER_TEMP/.npmrc` apontando para o registry público — é esse arquivo que o npm CLI consulta.

### 2b. Remover o step `Configure npm authentication`

Remover integralmente:

```yaml
- name: Configure npm authentication
  run: echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc
  env:
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Esse step é o que acopla o workflow ao secret estático. Com Trusted Publisher, ele deixa de existir.

### 2c. Ajustar o step `Publish to npm`

De:

```yaml
- name: Publish to npm (OIDC Trusted Publisher)
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
  run: |
    npx nx release publish \
      --tag=${{ steps.tag.outputs.npm_tag }} \
      --registry=https://registry.npmjs.org \
      --provenance \
      --first-release
```

Para:

```yaml
- name: Publish to npm (OIDC Trusted Publisher)
  run: |
    npx nx release publish \
      --tag=${{ steps.tag.outputs.npm_tag }} \
      --registry=https://registry.npmjs.org \
      --provenance
```

Mudanças:

- Removido `env.NODE_AUTH_TOKEN` (não há token estático a passar)
- Removido `--first-release` (o pacote já existe; o flag só é válido no primeiro publish)

### 2d. Confirmar permissões do workflow

Já presentes no `release.yml` atual:

```yaml
permissions:
  contents: write
  id-token: write
```

`id-token: write` é o que permite ao GitHub emitir o OIDC token que o npm CLI troca por credencial efêmera. **Sem essa permissão, o publish falha.** Validar que continua no arquivo após as edições.

---

## Passo 3 — Validar em dry-run (opcional, recomendado)

Antes de merge em `main`, rodar um teste local do workflow via PR contra `develop`:

1. Criar branch `chore/migrate-trusted-publisher`
2. Aplicar as edições do Passo 2
3. Abrir PR contra `develop`
4. CI (`ci.yml`) não executa publish — então o PR só valida lint/test/build
5. Merge em `develop` → `release.yml` dispara com dist-tag `next`
6. Se falhar no publish, `NPM_TOKEN` **ainda existe como rede de segurança** → reverter o PR no `develop` e diagnosticar

**Não remover o secret antes do passo 4.**

---

## Passo 4 — Publish real e remoção do secret

1. Promover via PR `develop → main`
2. Merge dispara `release.yml` com dist-tag `latest`
3. Verificar no log do job:
   - Step `Publish to npm` imprime algo como `npm notice Authentication: oidc-trusted-publisher` (mensagem específica do npm CLI quando autentica via OIDC)
   - `npm view @bhs-dev/typescript-common-types@<nova-versão>` retorna a versão recém-publicada
4. **Após publish confirmado:** GitHub → Settings → Secrets and variables → Actions → **Delete** `NPM_TOKEN`
5. Revogar o Classic Automation Token em `npmjs.com → Account → Access Tokens` (remoção do secret no GitHub não invalida o token no npm)

---

## Passo 5 — Atualizar documentação

- [ ] Atualizar [ADR-0001 §7](../../../adr/ADR-0001-publication-strategy.md#7-autenticação-sem-credenciais-estáticas) e marcar o Addendum 2026-04-20 D1 como **resolvido** com data
- [ ] Atualizar o status deste arquivo para `✅ Concluída` com a data
- [ ] Registrar no histórico de release a versão que serviu como primeira publicação OIDC

---

## Critérios de aceitação

A phase está concluída quando **todos** os itens abaixo forem verdadeiros:

| Critério                                    | Verificação                                                       |
| ------------------------------------------- | ----------------------------------------------------------------- |
| Trusted Publisher configurado no npmjs.com  | Badge "Trusted Publisher configured" visível na página do pacote  |
| `NPM_TOKEN` removido do repositório         | GitHub → Settings → Secrets → Actions não lista `NPM_TOKEN`       |
| `release.yml` sem referências a `NPM_TOKEN` | `grep -r NPM_TOKEN .github/` retorna vazio                        |
| Release subsequente publicada via OIDC      | Log do job mostra autenticação OIDC; `npm view` confirma a versão |
| Classic Automation Token revogado no npm    | `npmjs.com → Access Tokens` não lista o token antigo              |
| ADR-0001 atualizado                         | Status do Addendum D1 marcado como resolvido                      |

---

## Riscos e mitigação

| Risco                                                               | Mitigação                                                                                                             |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Publish falha em `main` após remoção do secret (config OIDC errada) | Validar em `develop` primeiro (Passo 3); manter secret até confirmação em `main` (Passo 4)                            |
| Trusted Publisher configurado com workflow filename errado          | `workflow filename` é **exatamente** `release.yml` (sem path prefix); a UI aceita string livre mas o match é estrito  |
| Environment name preenchido por engano                              | Deixar vazio — o workflow atual não usa `environment:` em nenhum step; preencher força o match a falhar               |
| `--first-release` esquecido no código                               | Já será removido no Passo 2c; sem remover, o publish falha com erro claro ("package already exists")                  |
| Phase 05 iniciada antes da conclusão desta                          | Bloquear via checklist: não abrir branch `feat/typescript-common-errors` enquanto esta phase estiver em `🟡 Pendente` |

---

## Fora do escopo desta phase

- Configuração do GCP Artifact Registry para canal `dev` (PR artifacts) — escopo da phase que habilitar o canal privado
- Renomeação do scope `@bhs-dev` → `@bhs` — condição de revisão separada no ADR-0001 §1
- Trusted Publisher para demais pacotes do monorepo — repetir o Passo 1 em cada publish inaugural das phases subsequentes
