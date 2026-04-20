import type { Request, RequestHandler, ErrorRequestHandler } from 'express';

/**
 * Generic class constructor type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClassCtor<T> = new (...args: any[]) => T;

/**
 * DI scope types for tsyringe container registration.
 */
export enum ScopeTypes {
    TRANSIENT = 'transient',
    SINGLETON = 'singleton',
}

/**
 * Options for CustomError construction.
 */
export type CustomErrorOptions = {
    details?: unknown;
    cause?: unknown;
    exposeMessage?: boolean;
};

/**
 * Environment variable definition.
 */
export type EnvVariable = {
    key: string;
    required: boolean;
    default?: string;
    description?: string;
};

/**
 * List of environment variable definitions.
 */
export type EnvList = EnvVariable[];

/**
 * Base error for environment-related failures.
 */
export class EnvironmentError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EnvironmentError';
        Object.setPrototypeOf(this, EnvironmentError.prototype);
    }
}

/**
 * Thrown when required environment variables are missing.
 */
export class EnvVarsNotFoundError extends EnvironmentError {
    constructor(missingVars: EnvVariable[]) {
        const message = `Variáveis de ambiente obrigatórias: ${missingVars.map((v) => v.key).join(', ')}`;
        super(message);
        this.name = 'EnvVarsNotFoundError';
        Object.setPrototypeOf(this, EnvVarsNotFoundError.prototype);
    }
}

/**
 * HTTP methods supported by the HTTP client.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Response type for the HTTP client.
 */
export type HttpResponseType = 'json' | 'text' | 'buffer';

/**
 * Error thrown on non-successful HTTP responses.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class HttpError<T = any> extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly data: T | null,
        public readonly url: string,
        public readonly method: string,
        public readonly requestId?: string,
    ) {
        super(message);
        this.name = 'HttpError';
    }
}

/**
 * Error thrown when an HTTP request times out.
 */
export class HttpTimeoutError extends HttpError {
    constructor(
        message: string,
        public readonly timeoutMs: number,
        public override readonly url: string,
        public override readonly method: string,
        public override readonly requestId?: string,
    ) {
        super(message, 408, null, url, method, requestId);
        this.name = 'HttpTimeoutError';
    }
}

/**
 * Factory function that produces Express middleware.
 */
export type MiddlewareFactory = () => RequestHandler | ErrorRequestHandler;

/**
 * Route definition for declarative route registration.
 */
export interface RouteDef {
    method: HttpMethod;
    path: string;
    middlewares?: RequestHandler[];
    handler: RequestHandler;
}

/**
 * Parts of a request that can be validated.
 */
export type RequestParts = 'body' | 'params' | 'query' | 'headers';

/**
 * Express Request with typed body.
 */
export type TypedRequestBody<B> = Request<unknown, unknown, B>;

/**
 * Express Request with typed params, query, and body.
 */
export type TypedRequest<P = unknown, Q = unknown, B = unknown> = Request<P, unknown, B, Q>;
