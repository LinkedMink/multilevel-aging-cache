const { defaults: tsjPreset } = require("ts-jest/presets");
const baseConfig = require("../../jest.config.js");

baseConfig.preset = "@shelf/jest-mongodb";
baseConfig.testPathIgnorePatterns = ["/node_modules/"];
baseConfig.transform = tsjPreset.transform;

module.exports = baseConfig;
