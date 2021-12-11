import tsjPreset from 'ts-jest/presets'
import baseConfig from '../../main/jest.config'

baseConfig.preset = '@shelf/jest-mongodb';
baseConfig.testPathIgnorePatterns = ['/node_modules/'];
baseConfig.transform = tsjPreset.defaults.transform;

module.exports = baseConfig;
