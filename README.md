# typescript-common-packages

Monorepo Nx com pacotes TypeScript reutilizáveis extraídos do [ts-express-app](https://github.com/bhenriq-souza/ts-express-app).

## Decisões de Arquitetura

- [ADR-0001 — Estratégia de Publicação](docs/adr/ADR-0001-publication-strategy.md)

## Pacotes

| Pacote | Descrição |
|--------|-----------|
| `@bhs-dev/typescript-common-types` | Contratos puros (interfaces, types, symbols) |
| `@bhs-dev/typescript-common-errors` | Erros customizados com factories HTTP |
| `@bhs-dev/typescript-common-env` | Serviço de variáveis de ambiente |
| `@bhs-dev/typescript-common-context` | Request context com AsyncLocalStorage |
| `@bhs-dev/typescript-common-logger` | Logger context-aware com Winston |
| `@bhs-dev/typescript-common-http` | HTTP client com retry e helpers de resposta |
| `@bhs-dev/typescript-common-middlewares` | Middlewares Express reutilizáveis |
| `@bhs-dev/typescript-common-express` | Base para apps Express (routing e módulos) |

## Desenvolvimento

```bash
# Instalar dependências
npm ci

# Rodar lint, test e build em todos os pacotes afetados
npx nx affected -t lint test build

# Rodar um target em pacote específico
npx nx run @bhs-dev/typescript-common-types:build
```

## Criar um Pacote Novo

Veja o [runbook de onboarding](docs/runbooks/package-onboarding.md).

## Fluxo de Release

1. Criar branch de feature a partir de `develop`
2. Incluir **version plan** em `.nx/version-plans/` (obrigatório para PRs que alteram pacotes)
3. PR → CI valida lint/test/build + publica artefato dev no Artifact Registry
4. Merge em `develop` → publica no npm com dist-tag `next`
5. Merge em `main` → publica no npm com dist-tag `latest` + GitHub Release

## Infraestrutura

- **Registry dev (PR):** GCP Artifact Registry (`typescript-packages-dev`)
- **Registry estável:** npm público (`registry.npmjs.org`)
- **Cache Nx:** GCS (`gs://typescript-nx-cache`)
- **Auth CI:** Workload Identity Federation (zero secrets estáticos)
