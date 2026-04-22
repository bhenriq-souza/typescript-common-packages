# @bhs-dev/typescript-common-errors

Erros customizados do ecossistema `@bhs-dev/*` com factories HTTP para cenarios comuns de API. Este pacote depende apenas de `@bhs-dev/typescript-common-types` para reutilizar `CustomErrorOptions`.

## Instalacao

```bash
npm install @bhs-dev/typescript-common-errors @bhs-dev/typescript-common-types
```

## Peer Dependencies

Nenhuma.

## Conteudo

### `CustomError`

Classe base para erros operacionais expostos pela aplicacao.

| Propriedade     | Tipo      | Descricao                                            |
| --------------- | --------- | ---------------------------------------------------- |
| `status`        | `number`  | HTTP status associado ao erro                        |
| `code`          | `string`  | Codigo estavel para tratamento programatico          |
| `details`       | `unknown` | Payload opcional com detalhes adicionais             |
| `isOperational` | `boolean` | Sempre `true` para diferenciar de falhas inesperadas |
| `exposeMessage` | `boolean` | Indica se a mensagem pode ser retornada ao cliente   |

### Factories HTTP

| Factory                    | Status padrao | Code padrao                 |
| -------------------------- | ------------- | --------------------------- |
| `badRequest()`             | `400`         | `BAD_REQUEST`               |
| `apiModuleNotRecognized()` | `400`         | `API_MODULE_NOT_RECOGNIZED` |
| `unauthorized()`           | `401`         | `UNAUTHORIZED`              |
| `forbidden()`              | `403`         | `FORBIDDEN`                 |
| `notFound()`               | `404`         | `NOT_FOUND`                 |
| `conflict()`               | `409`         | `CONFLICT`                  |
| `unprocessable()`          | `422`         | `UNPROCESSABLE`             |
| `tooManyRequests()`        | `429`         | `TOO_MANY_REQUESTS`         |
| `internal()`               | `500`         | `INTERNAL`                  |

## Exemplos de Uso

### Criar um erro customizado

```typescript
import { CustomError } from '@bhs-dev/typescript-common-errors';

throw new CustomError(400, 'INVALID_INPUT', 'Payload invalido', {
  details: { field: 'email' },
  exposeMessage: true,
});
```

### Usar uma factory HTTP

```typescript
import { CustomError } from '@bhs-dev/typescript-common-errors';

throw CustomError.notFound('User not found', 'USER_NOT_FOUND', {
  exposeMessage: true,
});
```

### Encadear causa raiz

```typescript
import { CustomError } from '@bhs-dev/typescript-common-errors';

try {
  await externalCall();
} catch (cause) {
  throw CustomError.internal('Integration failed', 'INTEGRATION_ERROR', {
    cause,
    details: { provider: 'external-api' },
  });
}
```

## Desenvolvimento

```bash
# Build
nx build typescript-common-errors

# Testes
nx test typescript-common-errors

# Lint
nx lint typescript-common-errors
```

## Licenca

ISC
