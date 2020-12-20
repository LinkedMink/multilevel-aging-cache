"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgingCacheWriteStatus = void 0;
/**
 * Describes what happened during a write to an aging cache
 */
var AgingCacheWriteStatus;
(function (AgingCacheWriteStatus) {
    /**
     * All caches were written successfully
     */
    AgingCacheWriteStatus[AgingCacheWriteStatus["Success"] = 0] = "Success";
    /**
     * Lower level caches were updated from a newer value in a higher level cache
     */
    AgingCacheWriteStatus[AgingCacheWriteStatus["Refreshed"] = 1] = "Refreshed";
    /**
     * A higher level cache had a value update, but a write failed to a lower level cache
     */
    AgingCacheWriteStatus[AgingCacheWriteStatus["RefreshedError"] = 2] = "RefreshedError";
    /**
     * Higher level caches were updated, but a lower level cache failed
     */
    AgingCacheWriteStatus[AgingCacheWriteStatus["PartialWrite"] = 3] = "PartialWrite";
    /**
     * An error occured while writing
     */
    AgingCacheWriteStatus[AgingCacheWriteStatus["UnspecifiedError"] = 4] = "UnspecifiedError";
})(AgingCacheWriteStatus = exports.AgingCacheWriteStatus || (exports.AgingCacheWriteStatus = {}));
//# sourceMappingURL=IAgingCache.js.map