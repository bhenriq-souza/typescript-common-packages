module.exports = {
  displayName: 'typescript-common-types',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/packages/typescript-common-types',
  // Pacote de contratos puros (interfaces, types, symbols) — sem lógica de negócio para medir.
  // Thresholds são aplicados no preset raiz para pacotes com implementação.
  coverageThreshold: undefined,
};
