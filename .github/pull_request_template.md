## Descrição

<!-- Descreva brevemente o que este PR faz. -->

## Checklist

- [ ] Código compila sem erros (`nx affected -t build`)
- [ ] Testes passam (`nx affected -t test`)
- [ ] Lint passa (`nx affected -t lint`)
- [ ] **Version plan** incluído em `.nx/version-plans/` (obrigatório se pacotes foram alterados)
- [ ] Documentação atualizada (se aplicável)

## Version Plan

<!-- Se este PR altera código de pacote, cole o conteúdo do version plan aqui para revisão: -->

```md
---
"@bhs-dev/<pacote>": patch|minor|major
---

Motivo do bump.
```
