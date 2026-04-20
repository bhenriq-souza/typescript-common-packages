# @bhs-dev/typescript-common-types

Contratos puros do ecossistema `@bhs-dev/*` — interfaces, types, error classes e symbols de DI. Este é o pacote raiz do grafo de dependências: **zero implementação, zero dependência runtime**.

## Instalação

```bash
npm install @bhs-dev/typescript-common-types
```

### Peer Dependencies

| Pacote | Motivo |
|--------|--------|
| `express` >= 5.0.0 | Tipos de `Request`, `Router`, `RequestHandler`, `ErrorRequestHandler` usados nas interfaces |

## Conteúdo

### Interfaces

Contratos genéricos para serviços e componentes do backend:

| Interface | Descrição |
|-----------|-----------|
| `ILogger` | Logger estruturado com suporte a child loggers |
| `IEnvService` | Acesso tipado a variáveis de ambiente |
| `IHttpRequestOptions<TBody>` | Configuração completa de request HTTP (method, url, headers, retry, timeout) |
| `HttpResponse<T>` | Wrapper de resposta HTTP com status, headers e data tipado |
| `IHttpService` | Cliente HTTP com CRUD completo e correlation ID |
| `IBaseRoute` / `IRouteModule` | Contrato de módulo de rotas Express |
| `MiddlewareConfig` | Entrada de configuração do pipeline de middlewares (order, factory, enableIf) |

### Types

| Type/Enum | Descrição |
|-----------|-----------|
| `ClassCtor<T>` | Construtor genérico de classe |
| `ScopeTypes` | Enum de escopos DI (`TRANSIENT`, `SINGLETON`) |
| `CustomErrorOptions` | Opções para construção de erros customizados |
| `EnvVariable` / `EnvList` | Definição de variável de ambiente (key, required, default) |
| `HttpMethod` | Métodos HTTP suportados (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`) |
| `HttpResponseType` | Tipo de resposta (`json`, `text`, `buffer`) |
| `RouteDef` | Definição declarativa de rota (method, path, handler, middlewares) |
| `RequestParts` | Partes validáveis de uma request (`body`, `params`, `query`, `headers`) |
| `TypedRequest<P,Q,B>` | Express Request com params, query e body tipados |
| `TypedRequestBody<B>` | Express Request com body tipado |
| `MiddlewareFactory` | Factory que produz middleware Express |

### Error Classes

| Classe | Herança | Descrição |
|--------|---------|-----------|
| `EnvironmentError` | `Error` | Erro base para falhas de ambiente |
| `EnvVarsNotFoundError` | `EnvironmentError` | Variáveis obrigatórias ausentes |
| `HttpError<T>` | `Error` | Resposta HTTP não-sucesso (status, data, url, method) |
| `HttpTimeoutError` | `HttpError` | Timeout de request HTTP (status 408) |

### Symbols (DI)

Tokens para injeção de dependência com `tsyringe`:

| Symbol | Uso |
|--------|-----|
| `EnvServiceSymbol` | Serviço de variáveis de ambiente |
| `ProcessEnvSymbol` | `process.env` injetável |
| `EnvListSymbol` | Lista de variáveis de ambiente da aplicação |
| `LoggerServiceSymbol` | Serviço de logging |
| `HttpResponsesSymbol` | Helper de respostas HTTP |
| `RequestContextSymbol` | Contexto request-scoped (AsyncLocalStorage) |
| `ValidationMiddlewareSymbol` | Middleware de validação |
| `HttpServiceSymbol` | Cliente HTTP |

## Exemplos de Uso

### Implementar um Logger

```typescript
import { ILogger } from '@bhs-dev/typescript-common-types';

class ConsoleLogger implements ILogger {
    child(meta?: Record<string, unknown>): ILogger {
        return this; // simplificado
    }
    debug(msg: string, meta?: Record<string, unknown>): void { console.debug(msg, meta); }
    info(msg: string, meta?: Record<string, unknown>): void { console.info(msg, meta); }
    warn(msg: string, meta?: Record<string, unknown>): void { console.warn(msg, meta); }
    error(msg: string, meta?: Record<string, unknown> | Error): void { console.error(msg, meta); }
}
```

### Registrar um serviço com Symbol DI

```typescript
import { container } from 'tsyringe';
import { LoggerServiceSymbol, ILogger } from '@bhs-dev/typescript-common-types';
import { WinstonLogger } from './winston-logger';

container.registerSingleton<ILogger>(LoggerServiceSymbol, WinstonLogger);
```

### Definir variáveis de ambiente

```typescript
import { EnvList } from '@bhs-dev/typescript-common-types';

const envList: EnvList = [
    { key: 'APPLICATION_NAME', required: true, description: 'Nome da aplicação' },
    { key: 'SERVER_PORT', required: true, default: '3000' },
    { key: 'LOG_LEVEL', required: false, default: 'info' },
];
```

### Tipar uma rota Express

```typescript
import { RouteDef, TypedRequestBody } from '@bhs-dev/typescript-common-types';
import { Request, Response } from 'express';

interface CreateUserBody {
    name: string;
    email: string;
}

const createUser = (req: TypedRequestBody<CreateUserBody>, res: Response) => {
    const { name, email } = req.body;
    res.status(201).json({ name, email });
};
```

### Tratar erros HTTP

```typescript
import { HttpError, HttpTimeoutError } from '@bhs-dev/typescript-common-types';

try {
    const response = await httpService.get('/api/users', correlationId);
} catch (error) {
    if (error instanceof HttpTimeoutError) {
        console.error(`Timeout após ${error.timeoutMs}ms em ${error.url}`);
    } else if (error instanceof HttpError) {
        console.error(`HTTP ${error.status} em ${error.method} ${error.url}`);
    }
}
```

### Configurar pipeline de middlewares

```typescript
import { MiddlewareConfig } from '@bhs-dev/typescript-common-types';

const middlewares: MiddlewareConfig[] = [
    {
        id: 'correlation-id',
        description: 'Injeta correlation ID no request',
        order: 1,
        handler: correlationIdMiddleware,
    },
    {
        id: 'error-handler',
        description: 'Handler global de erros',
        order: 100,
        factory: () => createErrorHandler({ logger }),
        isErrorHandler: true,
    },
];
```

## Desenvolvimento

```bash
# Build
nx build typescript-common-types

# Testes
nx test typescript-common-types

# Lint
nx lint typescript-common-types
```

## Licença

ISC
