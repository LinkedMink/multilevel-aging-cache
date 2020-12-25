import winston, { LoggerOptions } from "winston";
import { MockTransport } from "./MockTransport";

const NODE_ENV_TEST = "test";

/**
 * Expose the logger constructor, so that output can be customized
 */
export class Logger {
  static GLOBAL_LABEL = "AppGlobalLogger";

  static get options(): LoggerOptions {
    return Logger.optionsValue;
  }

  /**
   * Change the options before constructing a logger. A logger will use the options
   * set at the time the first get() is called for a specific label
   */
  static set options(options: LoggerOptions) {
    Logger.optionsValue = options;
  }

  /**
   * Wrap the Winston logger container, so we can get the same logger for each module.
   * @param label The label of the module we're logging
   * @return An instance of the logger
   */
  static get(label: string = Logger.GLOBAL_LABEL): winston.Logger {
    if (!winston.loggers.has(label)) {
      winston.loggers.add(label, Logger.optionsValue);
    }

    return winston.loggers.get(label);
  }

  private static optionsValue: LoggerOptions;
}

// Set default to console since we need at least one transport, should override in actual app
if (process.env.NODE_ENV !== NODE_ENV_TEST) {
  Logger.options = {
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
      }),
    ],
  };
} else {
  // TODO shouldn't have mock classes in actual source, but since ts-jest is runtime, we can't
  // reference Logger until it's transpiled. We need to set default before static construction of classes
  Logger.options = {
    transports: [
      new MockTransport({
        format: winston.format.simple(),
      }),
    ],
  };
}
