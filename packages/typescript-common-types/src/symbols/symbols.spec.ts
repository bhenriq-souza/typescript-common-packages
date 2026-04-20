import {
    EnvServiceSymbol,
    ProcessEnvSymbol,
    EnvListSymbol,
    LoggerServiceSymbol,
    HttpResponsesSymbol,
    RequestContextSymbol,
    ValidationMiddlewareSymbol,
    HttpServiceSymbol,
} from '../symbols';

describe('DI Symbols', () => {
    const allSymbols = [
        { name: 'EnvServiceSymbol', symbol: EnvServiceSymbol },
        { name: 'ProcessEnvSymbol', symbol: ProcessEnvSymbol },
        { name: 'EnvListSymbol', symbol: EnvListSymbol },
        { name: 'LoggerServiceSymbol', symbol: LoggerServiceSymbol },
        { name: 'HttpResponsesSymbol', symbol: HttpResponsesSymbol },
        { name: 'RequestContextSymbol', symbol: RequestContextSymbol },
        { name: 'ValidationMiddlewareSymbol', symbol: ValidationMiddlewareSymbol },
        { name: 'HttpServiceSymbol', symbol: HttpServiceSymbol },
    ];

    it.each(allSymbols)('$name should be a Symbol', ({ symbol }) => {
        expect(typeof symbol).toBe('symbol');
    });

    it('all symbols should be unique', () => {
        const symbolSet = new Set(allSymbols.map((s) => s.symbol));
        expect(symbolSet.size).toBe(allSymbols.length);
    });

    it.each(allSymbols)('$name should have a descriptive label', ({ name, symbol }) => {
        expect(symbol.toString()).toBe(`Symbol(${name})`);
    });
});
