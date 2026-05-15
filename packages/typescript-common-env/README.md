# @bhs-dev/typescript-common-env

Serviço de variáveis de ambiente do ecossistema `@bhs-dev/*` com validação de obrigatórias e preenchimento de `default`s. Extrai o padrão já estabilizado no `ts-express-app` e consome os contratos publicados em `@bhs-dev/typescript-common-types`.

## Instalacao

```bash
npm install @bhs-dev/typescript-common-env @bhs-dev/typescript-common-types
npm install tsyringe reflect-metadata
```

## Peer Dependencies

| Peer               | Versão     |
| ------------------ | ---------- |
| `tsyringe`         | `>=4.10.0` |
| `reflect-metadata` | `>=0.2.0`  |

`reflect-metadata` deve ser importado **uma única vez** no entry point da aplicação consumidora (`import 'reflect-metadata';`) antes de qualquer resolução via `tsyringe`.

## Conteudo

### `EnvService`

Classe `@injectable()` que recebe via DI o `process.env` e a `EnvList` configurada pela aplicação, valida obrigatórias e preenche defaults no construtor.

| Operação                                           | Comportamento                                                 |
| -------------------------------------------------- | ------------------------------------------------------------- |
| Variável já presente em `env`                      | Preserva o valor existente                                    |
| Variável ausente com `default`                     | Preenche `env[key]` com `default`                             |
| Variável ausente, `required: false`, sem `default` | Ignora                                                        |
| Variável ausente, `required: true`, sem `default`  | Acumula e lança `EnvVarsNotFoundError` com todas as faltantes |

`getEnv(key)` retorna o valor da variável (cast `string`). Se `key` não foi declarada na `EnvList` e também não existe em `process.env`, retorna `undefined` em runtime — a tipagem declara `string` por contrato da interface `IEnvService`.

## Exemplos de Uso

### Registro no container `tsyringe`

```typescript
import 'reflect-metadata';
import { container } from 'tsyringe';

import { EnvService } from '@bhs-dev/typescript-common-env';
import {
  EnvListSymbol,
  EnvServiceSymbol,
  ProcessEnvSymbol,
  type EnvList,
} from '@bhs-dev/typescript-common-types';

const envList: EnvList = [
  { key: 'PORT', required: true, default: '3000' },
  { key: 'DATABASE_URL', required: true },
  { key: 'LOG_LEVEL', required: false, default: 'info' },
];

container.register(EnvListSymbol, { useValue: envList });
container.registerInstance(ProcessEnvSymbol, process.env);
container.register<EnvService>(EnvServiceSymbol, EnvService);
```

### Resolução e leitura

```typescript
import { container } from 'tsyringe';
import {
  EnvServiceSymbol,
  type IEnvService,
} from '@bhs-dev/typescript-common-types';

const envService = container.resolve<IEnvService>(EnvServiceSymbol);
const port = envService.getEnv('PORT');
```

### Tratamento de variáveis ausentes

```typescript
import { EnvVarsNotFoundError } from '@bhs-dev/typescript-common-types';

try {
  container.resolve<IEnvService>(EnvServiceSymbol);
} catch (err) {
  if (err instanceof EnvVarsNotFoundError) {
    console.error(err.message);
    process.exit(1);
  }
  throw err;
}
```

## Desenvolvimento

```bash
# Build
nx build typescript-common-env

# Testes
nx test typescript-common-env

# Lint
nx lint typescript-common-env
```

## Licenca

ISC
