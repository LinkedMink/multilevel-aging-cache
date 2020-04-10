import winston from "winston"

/**
 * Expose the logger constructor, so that output can be customized
 */
export class Logger {
  /**
   * Change the options before constructing a cache. Any logger within the package,
   * will use these options.
   */
  static options: winston.LoggerOptions = {
    transports: [
      process.env.NODE_ENV !== "test" 
        ? new winston.transports.Console({ format: winston.format.simple() })
        : new winston.transports.File({ filename: "test.log" })
    ],
  };

  /**
   * Wrap the Winston logger container, so we can get the same logger for each module.
   * @param label The label of the module we're logging
   * @return An instance of the logger
   */
  static get(label: string): winston.Logger {
    if (!winston.loggers.has(label)) {
      winston.loggers.add(label, Logger.options);
    }

    return winston.loggers.get(label);
  };
}