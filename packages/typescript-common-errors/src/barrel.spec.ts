import * as barrel from './index';

describe('Barrel exports', () => {
  it('should export CustomError', () => {
    expect(barrel).toHaveProperty('CustomError');
  });

  it('should expose the static HTTP factories through the public export', () => {
    expect(typeof barrel.CustomError.badRequest).toBe('function');
    expect(typeof barrel.CustomError.apiModuleNotRecognized).toBe('function');
    expect(typeof barrel.CustomError.unauthorized).toBe('function');
    expect(typeof barrel.CustomError.forbidden).toBe('function');
    expect(typeof barrel.CustomError.notFound).toBe('function');
    expect(typeof barrel.CustomError.conflict).toBe('function');
    expect(typeof barrel.CustomError.unprocessable).toBe('function');
    expect(typeof barrel.CustomError.tooManyRequests).toBe('function');
    expect(typeof barrel.CustomError.internal).toBe('function');
  });
});
