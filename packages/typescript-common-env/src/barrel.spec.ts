import 'reflect-metadata';

import * as barrel from './index';

describe('Barrel exports', () => {
  it('should export EnvService', () => {
    expect(barrel).toHaveProperty('EnvService');
    expect(typeof barrel.EnvService).toBe('function');
  });
});
