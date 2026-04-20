# Version Plans

Diretório para version plans do Nx Release (modo independent versioning).

## Formato

Cada PR que altere código de pacote **deve** incluir um arquivo `.md` neste diretório:

```md
---
"@bhs-dev/typescript-common-types": minor
---

Descrição curta do que mudou e por que o bump é minor.
```

## Regras

- **Obrigatório:** o CI bloqueia merge de PRs que alterem pacotes sem version plan correspondente.
- **Bumps válidos:** `patch`, `minor`, `major`.
- **Um plan por PR:** agrupe todas as mudanças do PR em um único arquivo.
- **Nomeação:** use o número do PR ou descrição curta (ex: `add-retry-to-http.md`).
- Plans são consumidos automaticamente pelo `nx release version` no merge em `develop` ou `main`.
