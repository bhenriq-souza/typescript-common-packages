import * as barrel from './index';

describe('Barrel exports', () => {
    const expectedExports = [
        // Interfaces (type-only — validated by compilation, not runtime)

        // Types & Enums
        'ScopeTypes',

        // Error classes
        'EnvironmentError',
        'EnvVarsNotFoundError',
        'HttpError',
        'HttpTimeoutError',

        // Symbols
        'EnvServiceSymbol',
        'ProcessEnvSymbol',
        'EnvListSymbol',
        'LoggerServiceSymbol',
        'HttpResponsesSymbol',
        'RequestContextSymbol',
        'ValidationMiddlewareSymbol',
        'HttpServiceSymbol',
    ];

    it.each(expectedExports)('should export %s', (exportName) => {
        expect(barrel).toHaveProperty(exportName);
    });

    it('should export ScopeTypes enum with correct values', () => {
        expect(barrel.ScopeTypes.TRANSIENT).toBe('transient');
        expect(barrel.ScopeTypes.SINGLETON).toBe('singleton');
    });
});
