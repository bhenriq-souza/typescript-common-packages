import { CustomError } from './custom-error';

describe('CustomError', () => {
  it('should instantiate with the expected base properties', () => {
    const error = new CustomError(400, 'BAD', 'Bad error');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(CustomError);
    expect(error.name).toBe('CustomError');
    expect(error.status).toBe(400);
    expect(error.code).toBe('BAD');
    expect(error.message).toBe('Bad error');
    expect(error.isOperational).toBe(true);
    expect(error.exposeMessage).toBe(false);
    expect(error.details).toBeUndefined();
  });

  it('should set details, exposeMessage and cause from opts', () => {
    const cause = new Error('Root cause');
    const error = new CustomError(500, 'FAILED', 'Failed', {
      details: { a: 1 },
      exposeMessage: true,
      cause,
    });

    expect(error.details).toEqual({ a: 1 });
    expect(error.exposeMessage).toBe(true);
    expect((error as Error & { cause?: unknown }).cause).toBe(cause);
  });

  it.each([
    [
      'badRequest',
      CustomError.badRequest('Missing data', 'MISSING_DATA'),
      400,
      'MISSING_DATA',
      'Missing data',
    ],
    [
      'apiModuleNotRecognized',
      CustomError.apiModuleNotRecognized(),
      400,
      'API_MODULE_NOT_RECOGNIZED',
      'API module not recognized',
    ],
    [
      'unauthorized',
      CustomError.unauthorized('No token'),
      401,
      'UNAUTHORIZED',
      'No token',
    ],
    ['forbidden', CustomError.forbidden(), 403, 'FORBIDDEN', 'Forbidden'],
    [
      'notFound',
      CustomError.notFound('User not found'),
      404,
      'NOT_FOUND',
      'User not found',
    ],
    ['conflict', CustomError.conflict(), 409, 'CONFLICT', 'Conflict'],
    [
      'unprocessable',
      CustomError.unprocessable(),
      422,
      'UNPROCESSABLE',
      'Unprocessable entity',
    ],
    [
      'tooManyRequests',
      CustomError.tooManyRequests(),
      429,
      'TOO_MANY_REQUESTS',
      'Too many requests',
    ],
    [
      'internal',
      CustomError.internal(),
      500,
      'INTERNAL',
      'Internal server error',
    ],
  ])(
    'should build the expected error via %s',
    (_factoryName, error, status, code, message) => {
      expect(error).toBeInstanceOf(CustomError);
      expect(error.status).toBe(status);
      expect(error.code).toBe(code);
      expect(error.message).toBe(message);
    },
  );
});
