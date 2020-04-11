import winston from "winston";
/**
 * Expose the logger constructor, so that output can be customized
 */
export declare class Logger {
    /**
     * Change the options before constructing a cache. Any logger within the package,
     * will use these options.
     */
    static options: winston.LoggerOptions;
    /**
     * Wrap the Winston logger container, so we can get the same logger for each module.
     * @param label The label of the module we're logging
     * @return An instance of the logger
     */
    static get(label: string): winston.Logger;
}
//# sourceMappingURL=Logger.d.ts.map