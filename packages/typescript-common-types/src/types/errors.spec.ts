import {
    EnvironmentError,
    EnvVarsNotFoundError,
    HttpError,
    HttpTimeoutError,
} from '../types';
import type { EnvVariable } from '../types';

describe('EnvironmentError', () => {
    it('should instantiate with correct name and message', () => {
        const error = new EnvironmentError('test message');
        expect(error.name).toBe('EnvironmentError');
        expect(error.message).toBe('test message');
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(EnvironmentError);
    });
});

describe('EnvVarsNotFoundError', () => {
    it('should instantiate with missing vars in message', () => {
        const missingVars: EnvVariable[] = [
            { key: 'DB_HOST', required: true },
            { key: 'DB_PORT', required: true },
        ];
        const error = new EnvVarsNotFoundError(missingVars);
        expect(error.name).toBe('EnvVarsNotFoundError');
        expect(error.message).toContain('DB_HOST');
        expect(error.message).toContain('DB_PORT');
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(EnvironmentError);
        expect(error).toBeInstanceOf(EnvVarsNotFoundError);
    });
});

describe('HttpError', () => {
    it('should instantiate with all properties', () => {
        const error = new HttpError('Not Found', 404, null, 'https://api.example.com/users', 'GET', 'req-123');
        expect(error.name).toBe('HttpError');
        expect(error.message).toBe('Not Found');
        expect(error.status).toBe(404);
        expect(error.data).toBeNull();
        expect(error.url).toBe('https://api.example.com/users');
        expect(error.method).toBe('GET');
        expect(error.requestId).toBe('req-123');
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(HttpError);
    });

    it('should store response data when provided', () => {
        const data = { error: 'validation_failed' };
        const error = new HttpError('Bad Request', 400, data, '/api', 'POST');
        expect(error.data).toEqual(data);
        expect(error.requestId).toBeUndefined();
    });
});

describe('HttpTimeoutError', () => {
    it('should instantiate with timeout properties and status 408', () => {
        const error = new HttpTimeoutError('Timeout', 5000, 'https://api.example.com', 'GET', 'req-456');
        expect(error.name).toBe('HttpTimeoutError');
        expect(error.message).toBe('Timeout');
        expect(error.status).toBe(408);
        expect(error.timeoutMs).toBe(5000);
        expect(error.url).toBe('https://api.example.com');
        expect(error.method).toBe('GET');
        expect(error.requestId).toBe('req-456');
        expect(error.data).toBeNull();
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(HttpError);
        expect(error).toBeInstanceOf(HttpTimeoutError);
    });
});
