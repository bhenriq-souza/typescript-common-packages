import type { Router, RequestHandler, ErrorRequestHandler } from 'express';
import type { HttpMethod, HttpResponseType, MiddlewareFactory } from '../types';

/**
 * Base route contract — any route module must expose a Router.
 */
export interface IBaseRoute {
    getRouter(): Router;
}

/**
 * Structured logger contract with child logger support.
 */
export interface ILogger {
    child(meta?: Record<string, unknown>): ILogger;
    debug(msg: string, meta?: Record<string, unknown>): void;
    info(msg: string, meta?: Record<string, unknown>): void;
    warn(msg: string, meta?: Record<string, unknown>): void;
    error(msg: string, meta?: Record<string, unknown> | Error): void;
}

/**
 * Environment service contract — typed access to env vars.
 */
export interface IEnvService {
    getEnv(key: string): string;
}

/**
 * Full HTTP request configuration for the HTTP client.
 */
export interface IHttpRequestOptions<TBody = unknown> {
    method: HttpMethod;
    url: string;
    path?: string;
    query?: Record<string, string | number | boolean | undefined | null>;
    headers?: Record<string, string>;
    body?: TBody;
    timeoutMs?: number;
    retries?: number;
    retryDelayBaseMs?: number;
    idempotent?: boolean;
    responseType?: HttpResponseType;
    absoluteUrl?: string;
    signal?: AbortSignal;
}

/**
 * HTTP response wrapper with status, headers and typed data.
 */
export interface HttpResponse<T> {
    status: number;
    headers: Headers;
    data: T;
}

/**
 * HTTP client contract — full CRUD with correlation ID tracking.
 */
export interface IHttpService {
    request<TResp = unknown, TBody = unknown>(
        opts: IHttpRequestOptions<TBody>,
        correlationId: string,
    ): Promise<HttpResponse<TResp>>;
    get<TResp = unknown>(
        url: string,
        correlationId: string,
        opts?: Omit<IHttpRequestOptions, 'method' | 'url' | 'body'>,
    ): Promise<HttpResponse<TResp>>;
    post<TResp = unknown, TBody = unknown>(
        url: string,
        correlationId: string,
        body?: TBody,
        opts?: Omit<IHttpRequestOptions<TBody>, 'method' | 'url' | 'body'>,
    ): Promise<HttpResponse<TResp>>;
    put<TResp = unknown, TBody = unknown>(
        url: string,
        correlationId: string,
        body?: TBody,
        opts?: Omit<IHttpRequestOptions<TBody>, 'method' | 'url' | 'body'>,
    ): Promise<HttpResponse<TResp>>;
    patch<TResp = unknown, TBody = unknown>(
        url: string,
        correlationId: string,
        body?: TBody,
        opts?: Omit<IHttpRequestOptions<TBody>, 'method' | 'path' | 'body'>,
    ): Promise<HttpResponse<TResp>>;
    delete<TResp = unknown>(
        url: string,
        correlationId: string,
        opts?: Omit<IHttpRequestOptions, 'method' | 'url' | 'body'>,
    ): Promise<HttpResponse<TResp>>;
}

/**
 * Route module contract — exposes a Router for registration.
 */
export interface IRouteModule {
    getRouter(): Router;
}

/**
 * Middleware pipeline configuration entry.
 */
export interface MiddlewareConfig {
    id: string;
    description?: string;
    order: number;
    path?: string | RegExp;
    handler?: RequestHandler | ErrorRequestHandler;
    factory?: MiddlewareFactory;
    isErrorHandler?: boolean;
    enableIf?: (env: NodeJS.ProcessEnv) => boolean;
}
