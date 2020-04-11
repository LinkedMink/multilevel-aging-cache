"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var IAgingCacheOptions_1 = require("./IAgingCacheOptions");
var RefreshAlwaysSetStrategy_1 = require("./write/RefreshAlwaysSetStrategy");
var OverwriteAlwaysSetStrategy_1 = require("./write/OverwriteAlwaysSetStrategy");
var OverwriteAgedSetStrategy_1 = require("./write/OverwriteAgedSetStrategy");
var RefreshAlwaysDeleteStrategy_1 = require("./write/RefreshAlwaysDeleteStrategy");
var OverwriteAlwaysDeleteStrategy_1 = require("./write/OverwriteAlwaysDeleteStrategy");
var OverwriteAgedDeleteStrategy_1 = require("./write/OverwriteAgedDeleteStrategy");
var Logger_1 = require("../shared/Logger");
var AgingCache_1 = require("./AgingCache");
var FIFOAgedQueue_1 = require("./expire/FIFOAgedQueue");
var logger = Logger_1.Logger.get('IAgingCacheFactory');
var agedQueueMap = new Map([
    [IAgingCacheOptions_1.AgingCacheReplacementPolicy.FIFO, FIFOAgedQueue_1.FIFOAgedQueue],
]);
var setStrategyMap = new Map([
    [IAgingCacheOptions_1.AgingCacheWriteMode.RefreshAlways, RefreshAlwaysSetStrategy_1.RefreshAlwaysSetStrategy],
    [IAgingCacheOptions_1.AgingCacheWriteMode.OverwriteAlways, OverwriteAlwaysSetStrategy_1.OverwriteAlwaysSetStrategy],
    [IAgingCacheOptions_1.AgingCacheWriteMode.OverwriteAged, OverwriteAgedSetStrategy_1.OverwriteAgedSetStrategy],
]);
var deleteStrategyMap = new Map([
    [IAgingCacheOptions_1.AgingCacheWriteMode.RefreshAlways, RefreshAlwaysDeleteStrategy_1.RefreshAlwaysDeleteStrategy],
    [IAgingCacheOptions_1.AgingCacheWriteMode.OverwriteAlways, OverwriteAlwaysDeleteStrategy_1.OverwriteAlwaysDeleteStrategy],
    [IAgingCacheOptions_1.AgingCacheWriteMode.OverwriteAged, OverwriteAgedDeleteStrategy_1.OverwriteAgedDeleteStrategy],
]);
function checkAgingCacheOptionsValid(options) {
    if (options.maxEntries !== undefined && options.maxEntries < 1) {
        return Error("maxEntries(" + options.maxEntries + "): must be greater than 0");
    }
    if (options.replacementPolicy === IAgingCacheOptions_1.AgingCacheReplacementPolicy.FIFO && options.ageLimit * 60 <= options.purgeInterval) {
        return Error("maxAge(" + options.ageLimit + " min): must be greater than purgeInterval(" + options.purgeInterval + " sec)");
    }
    if (options.purgeInterval < 10) {
        return Error("purgeInterval(" + options.purgeInterval + "): must be greater than 10 seconds");
    }
}
exports.checkAgingCacheOptionsValid = checkAgingCacheOptionsValid;
/**
 * Create a new instance of IAgingCache. This function is a factory that will construct the
 * corrent implementation based on the provided options.
 * @param hierarchy The storage hierarchy with the level index 0 being the lowest level
 * @param options Options for the behavior of the cache, if undefined use getDefaultAgingCacheOptions
 */
function createAgingCache(hierarchy, options) {
    if (!options) {
        options = IAgingCacheOptions_1.getDefaultAgingCacheOptions();
    }
    else {
        var validationError = checkAgingCacheOptionsValid(options);
        if (validationError) {
            logger.error(validationError.message);
            throw validationError;
        }
    }
    var agedQueueConstructor = agedQueueMap.get(options.replacementPolicy);
    if (!agedQueueConstructor) {
        throw new Error("Unsupported replacementPolicy: " + options.replacementPolicy);
    }
    var setStrategyConstructor = setStrategyMap.get(options.setMode);
    if (!setStrategyConstructor) {
        throw new Error("Unsupported setMode: " + options.setMode);
    }
    var deleteStrategyConstructor = deleteStrategyMap.get(options.deleteMode);
    if (!deleteStrategyConstructor) {
        throw new Error("Unsupported deleteMode: " + options.deleteMode);
    }
    var evictQueue = new agedQueueConstructor(options.maxEntries, options.ageLimit);
    var setStrategy = new setStrategyConstructor(hierarchy, evictQueue);
    var deleteStrategy = new deleteStrategyConstructor(hierarchy, evictQueue);
    return new AgingCache_1.AgingCache(hierarchy, evictQueue, setStrategy, deleteStrategy, options.purgeInterval);
}
exports.createAgingCache = createAgingCache;
//# sourceMappingURL=IAgingCacheFactory.js.map