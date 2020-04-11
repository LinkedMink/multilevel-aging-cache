"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var winston_1 = __importDefault(require("winston"));
/**
 * Expose the logger constructor, so that output can be customized
 */
var Logger = /** @class */ (function () {
    function Logger() {
    }
    /**
     * Wrap the Winston logger container, so we can get the same logger for each module.
     * @param label The label of the module we're logging
     * @return An instance of the logger
     */
    Logger.get = function (label) {
        if (!winston_1.default.loggers.has(label)) {
            winston_1.default.loggers.add(label, Logger.options);
        }
        return winston_1.default.loggers.get(label);
    };
    ;
    /**
     * Change the options before constructing a cache. Any logger within the package,
     * will use these options.
     */
    Logger.options = {
        transports: [
            process.env.NODE_ENV !== "test"
                ? new winston_1.default.transports.Console({ format: winston_1.default.format.simple() })
                : new winston_1.default.transports.File({ filename: "test.log" })
        ],
    };
    return Logger;
}());
exports.Logger = Logger;
//# sourceMappingURL=Logger.js.map