const { defaults: tsjPreset } = require("ts-jest/presets");

module.exports = {
  preset: "@shelf/jest-mongodb",
  testEnvironment: "node",
  verbose: true,
  moduleFileExtensions: ["js", "jsx", "json", "ts", "tsx", "node"],
  testMatch: ["**/tests/**/(*.test|*.spec).ts"],
  collectCoverage: true,
  collectCoverageFrom: ["src/**/!(*.spec|*.test|*.enum|index).ts"],
  coverageThreshold: {
    global: {
      statements: 75,
      branches: 75,
      functions: 75,
      lines: 75,
    },
  },
  testEnvironment: "node",
  transform: tsjPreset.transform,
};
