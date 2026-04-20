# Package Onboarding

Como criar um novo pacote no monorepo.

## 1. Gerar o pacote

```bash
npx nx g @nx/js:lib packages/<nome-do-pacote> \
  --publishable \
  --importPath=@bhs-dev/<nome-do-pacote>
```

## 2. Configurar `package.json` do pacote

```json
{
  "name": "@bhs-dev/<nome-do-pacote>",
  "version": "0.0.1",
  "type": "commonjs",
  "main": "./dist/src/index.js",
  "types": "./dist/src/index.d.ts",
  "files": ["dist/src", "README.md"],
  "publishConfig": {
    "access": "public"
  },
  "engines": {
    "node": ">=22.0.0"
  },
  "peerDependencies": {},
  "dependencies": {}
}
```

### Peer Dependencies por pacote (referência)

| Pacote | peerDependencies |
|--------|-----------------|
| `types` | `@types/express`, `tsyringe` (tipos) |
| `errors` | — |
| `env` | `tsyringe` |
| `context` | `tsyringe` |
| `logger` | `winston`, `tsyringe` |
| `http` | `tsyringe` |
| `middlewares` | `express`, `zod` |
| `express` | `express`, `tsyringe` |

## 3. Configurar `tsconfig.json` do pacote

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": ".",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

## 4. Configurar `tsconfig.spec.json`

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist/test",
    "types": ["jest", "node"]
  },
  "include": ["src/**/*.ts", "src/**/*.spec.ts"]
}
```

## 5. Adicionar path alias no `tsconfig.base.json` (raiz)

```json
{
  "paths": {
    "@bhs-dev/<nome-do-pacote>": ["packages/<nome-do-pacote>/src/index.ts"]
  }
}
```

## 6. Criar `src/index.ts`

Arquivo barrel que exporta a API pública do pacote.

## 7. Validar

```bash
npx nx run @bhs-dev/<nome-do-pacote>:build
npx nx run @bhs-dev/<nome-do-pacote>:test
npx nx run @bhs-dev/<nome-do-pacote>:lint
```

## Checklist

- [ ] `package.json` com scope `@bhs-dev`, `publishConfig.access: "public"`, `engines.node >= 22`
- [ ] `peerDependencies` corretas conforme grafo de dependências
- [ ] `tsconfig.json` estende `tsconfig.base.json`
- [ ] `src/index.ts` exporta API pública
- [ ] Path alias adicionado em `tsconfig.base.json`
- [ ] Testes unitários básicos existem
- [ ] Build gera `dist/` com `.js` e `.d.ts`
