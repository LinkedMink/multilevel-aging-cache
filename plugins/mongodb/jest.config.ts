import tsjPreset from 'ts-jest/presets';
import { defaultJestConfig } from '../../jest.config';

export default {
  ...defaultJestConfig,
  preset: '@shelf/jest-mongodb',
  transform: tsjPreset.defaults.transform,
};
