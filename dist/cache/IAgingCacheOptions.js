"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The algorithm for selecting which element should be replaced first in a cache
 */
var AgingCacheReplacementPolicy;
(function (AgingCacheReplacementPolicy) {
    /**
     * Replace items in a First-in First-out manner
     */
    AgingCacheReplacementPolicy[AgingCacheReplacementPolicy["FIFO"] = 0] = "FIFO";
})(AgingCacheReplacementPolicy = exports.AgingCacheReplacementPolicy || (exports.AgingCacheReplacementPolicy = {}));
/**
 * In a distributed environment, multiple instances could write to cache at once. This option
 * determines what should happen if an exiting entry is found in a higher level cache.
 */
var AgingCacheWriteMode;
(function (AgingCacheWriteMode) {
    /**
     * When a higher level cache has a key, refresh the lower level keys and only overwrite if
     * the force option is supplied
     */
    AgingCacheWriteMode[AgingCacheWriteMode["RefreshAlways"] = 0] = "RefreshAlways";
    /**
     * When our entry is newer, then allow it to take precedence and overwrite the higher level
     * caches. Refresh the lower level caches if older
     */
    AgingCacheWriteMode[AgingCacheWriteMode["OverwriteAged"] = 1] = "OverwriteAged";
    /**
     * Unconditionally overwrite the value that's stored in higher level caches
     */
    AgingCacheWriteMode[AgingCacheWriteMode["OverwriteAlways"] = 2] = "OverwriteAlways";
})(AgingCacheWriteMode = exports.AgingCacheWriteMode || (exports.AgingCacheWriteMode = {}));
/**
 * @return Options for a default FIFO cache
 */
function getDefaultAgingCacheOptions() {
    return {
        maxEntries: undefined,
        ageLimit: 200,
        purgeInterval: 60,
        replacementPolicy: AgingCacheReplacementPolicy.FIFO,
        setMode: AgingCacheWriteMode.OverwriteAged,
        deleteMode: AgingCacheWriteMode.OverwriteAged,
    };
}
exports.getDefaultAgingCacheOptions = getDefaultAgingCacheOptions;
//# sourceMappingURL=IAgingCacheOptions.js.map