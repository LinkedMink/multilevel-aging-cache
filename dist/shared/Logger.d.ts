import winston, { LoggerOptions } from "winston";
/**
 * Expose the logger constructor, so that output can be customized
 */
export declare class Logger {
    static GLOBAL_LABEL: string;
    static get options(): LoggerOptions;
    /**
     * Change the options before constructing a logger. A logger will use the options
     * set at the time the first get() is called for a specific label
     */
    static set options(options: LoggerOptions);
    /**
     * Wrap the Winston logger container, so we can get the same logger for each module.
     * @param label The label of the module we're logging
     * @return An instance of the logger
     */
    static get(label?: string): winston.Logger;
    private static optionsValue;
}
//# sourceMappingURL=Logger.d.ts.map