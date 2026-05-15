import 'reflect-metadata';

import {
  EnvVarsNotFoundError,
  type EnvList,
} from '@bhs-dev/typescript-common-types';

import { EnvService } from './env-service';

describe('EnvService', () => {
  it('preenche defaults quando variáveis não existem no env', () => {
    const fakeEnv: NodeJS.ProcessEnv = {};
    const envList: EnvList = [
      { key: 'FOO', required: true, default: 'foo-default' },
      { key: 'BAR', required: false, default: 'bar-default' },
    ];

    const svc = new EnvService(fakeEnv, envList);

    expect(fakeEnv['FOO']).toBe('foo-default');
    expect(fakeEnv['BAR']).toBe('bar-default');
    expect(svc.getEnv('FOO')).toBe('foo-default');
    expect(svc.getEnv('BAR')).toBe('bar-default');
  });

  it('não sobrescreve valores existentes no env', () => {
    const fakeEnv: NodeJS.ProcessEnv = { FOO: 'already-set' };
    const envList: EnvList = [
      { key: 'FOO', required: true, default: 'foo-default' },
    ];

    const svc = new EnvService(fakeEnv, envList);

    expect(fakeEnv['FOO']).toBe('already-set');
    expect(svc.getEnv('FOO')).toBe('already-set');
  });

  it('lança EnvVarsNotFoundError quando requeridas faltam e não há default', () => {
    const fakeEnv: NodeJS.ProcessEnv = {};
    const envList: EnvList = [
      { key: 'REQUIRED_1', required: true },
      { key: 'OPTIONAL', required: false },
      { key: 'REQUIRED_2', required: true },
    ];

    let caught: unknown;
    try {
      new EnvService(fakeEnv, envList);
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(EnvVarsNotFoundError);
    const msg = String(caught);
    expect(msg).toContain('REQUIRED_1');
    expect(msg).toContain('REQUIRED_2');
    expect(msg).not.toContain('OPTIONAL');
  });

  it('ignora variáveis opcionais sem default sem lançar erro', () => {
    const fakeEnv: NodeJS.ProcessEnv = {};
    const envList: EnvList = [{ key: 'OPTIONAL', required: false }];

    expect(() => new EnvService(fakeEnv, envList)).not.toThrow();
    expect(fakeEnv['OPTIONAL']).toBeUndefined();
  });

  it('getEnv retorna string exata do env injetado', () => {
    const fakeEnv: NodeJS.ProcessEnv = { TOKEN: 'abc123' };
    const envList: EnvList = [{ key: 'TOKEN', required: true }];

    const svc = new EnvService(fakeEnv, envList);
    expect(svc.getEnv('TOKEN')).toBe('abc123');
  });
});
