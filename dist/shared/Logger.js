"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
var winston_1 = __importDefault(require("winston"));
var MockTransport_1 = __importDefault(require("./MockTransport"));
var NODE_ENV_TEST = 'test';
/**
 * Expose the logger constructor, so that output can be customized
 */
var Logger = /** @class */ (function () {
    function Logger() {
    }
    Object.defineProperty(Logger, "options", {
        get: function () {
            return Logger.optionsValue;
        },
        /**
         * Change the options before constructing a logger. A logger will use the options
         * set at the time the first get() is called for a specific label
         */
        set: function (options) {
            Logger.optionsValue = options;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Wrap the Winston logger container, so we can get the same logger for each module.
     * @param label The label of the module we're logging
     * @return An instance of the logger
     */
    Logger.get = function (label) {
        if (label === void 0) { label = Logger.GLOBAL_LABEL; }
        if (!winston_1.default.loggers.has(label)) {
            winston_1.default.loggers.add(label, Logger.optionsValue);
        }
        return winston_1.default.loggers.get(label);
    };
    Logger.GLOBAL_LABEL = "AppGlobalLogger";
    return Logger;
}());
exports.Logger = Logger;
var transports = [];
if (process.env.NODE_ENV !== NODE_ENV_TEST) {
    transports.push(new winston_1.default.transports.Console({
        format: winston_1.default.format.simple(),
    }));
}
else {
    transports.push(new MockTransport_1.default({
        format: winston_1.default.format.simple(),
    }));
}
var options = {
    transports: transports,
};
Logger.options = options;
//# sourceMappingURL=Logger.js.map