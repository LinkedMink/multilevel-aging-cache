import { Config } from '@jest/types';

export const defaultJestConfig: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  modulePaths: ['<rootDir>/src'],
  moduleFileExtensions: ['js', 'jsx', 'json', 'ts', 'tsx', 'node'],
  testMatch: ['**/tests/**/(*.test|*.spec).ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/!(*.spec|*.test|*.enum|index).ts'],
  coverageThreshold: {
    global: {
      statements: 75,
      branches: 75,
      functions: 75,
      lines: 75,
    },
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tests/tsconfig.json',
    },
  },
};
