import type { CustomErrorOptions } from '@bhs-dev/typescript-common-types';

type ErrorWithCause = Error & { cause?: unknown };
type Constructor = abstract new (...args: never[]) => unknown;
type ErrorConstructorWithCapture = typeof Error & {
  captureStackTrace?: (
    targetObject: object,
    constructorOpt?: Constructor,
  ) => void;
};

export class CustomError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  readonly isOperational = true;
  readonly exposeMessage: boolean;

  constructor(
    status: number,
    code: string,
    message: string,
    opts: CustomErrorOptions = {},
  ) {
    super(message);

    this.name = 'CustomError';
    this.status = status;
    this.code = code;
    this.details = opts.details;
    this.exposeMessage = !!opts.exposeMessage;

    Object.setPrototypeOf(this, new.target.prototype);

    if (opts.cause) {
      (this as ErrorWithCause).cause = opts.cause;
    }

    const errorConstructor = Error as ErrorConstructorWithCapture;
    if (errorConstructor.captureStackTrace) {
      errorConstructor.captureStackTrace(this, new.target);
    }
  }

  static badRequest(
    message = 'Bad request',
    code = 'BAD_REQUEST',
    opts?: CustomErrorOptions,
  ) {
    return new CustomError(400, code, message, opts);
  }

  static apiModuleNotRecognized(
    message = 'API module not recognized',
    code = 'API_MODULE_NOT_RECOGNIZED',
    opts?: CustomErrorOptions,
  ) {
    return new CustomError(400, code, message, opts);
  }

  static unauthorized(
    message = 'Unauthorized',
    code = 'UNAUTHORIZED',
    opts?: CustomErrorOptions,
  ) {
    return new CustomError(401, code, message, opts);
  }

  static forbidden(
    message = 'Forbidden',
    code = 'FORBIDDEN',
    opts?: CustomErrorOptions,
  ) {
    return new CustomError(403, code, message, opts);
  }

  static notFound(
    message = 'Not found',
    code = 'NOT_FOUND',
    opts?: CustomErrorOptions,
  ) {
    return new CustomError(404, code, message, opts);
  }

  static conflict(
    message = 'Conflict',
    code = 'CONFLICT',
    opts?: CustomErrorOptions,
  ) {
    return new CustomError(409, code, message, opts);
  }

  static unprocessable(
    message = 'Unprocessable entity',
    code = 'UNPROCESSABLE',
    opts?: CustomErrorOptions,
  ) {
    return new CustomError(422, code, message, opts);
  }

  static tooManyRequests(
    message = 'Too many requests',
    code = 'TOO_MANY_REQUESTS',
    opts?: CustomErrorOptions,
  ) {
    return new CustomError(429, code, message, opts);
  }

  static internal(
    message = 'Internal server error',
    code = 'INTERNAL',
    opts?: CustomErrorOptions,
  ) {
    return new CustomError(500, code, message, opts);
  }
}
