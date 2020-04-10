import winston = require("winston");

import { Logger } from "../../src/shared/Logger";

describe("Logger.ts", () => {
  test("should return shared instance when label is the same", () => {
    const testLabel = "TEST";

    const logger1 = Logger.get(testLabel);
    const logger2 = Logger.get(testLabel);

    expect(logger1).toBe(logger2);
  });

  test("should construct new loggers with global options when they're changed", () => {
    const testExitOnErrorFunc = jest.fn();
    const testOptions: winston.LoggerOptions = {
      exitOnError: testExitOnErrorFunc,
    };

    const logger1 = Logger.get("LOGGER1");
    Logger.options = testOptions;
    const logger2 = Logger.get("LOGGER2");

    expect(logger1.exitOnError).not.toBe(testExitOnErrorFunc);
    expect(logger2.exitOnError).toBe(testExitOnErrorFunc);
  });
});
