"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgingCache = void 0;
var IAgingCache_1 = require("./IAgingCache");
var Logger_1 = require("../shared/Logger");
/**
 * A cache that will replace entries in the order specified by the input IAgedQueue
 */
var AgingCache = /** @class */ (function () {
    /**
     * @param hierarchy The storage hierarchy to operate on
     * @param evictQueue The keys in the order to evict
     * @param setStrategy The implementation for setting keys
     * @param deleteStrategy The implementation for deleting keys
     * @param purgeInterval The interval to check for old entries in seconds
     */
    function AgingCache(hierarchy, evictQueue, setStrategy, deleteStrategy, purgeInterval) {
        var _this = this;
        if (purgeInterval === void 0) { purgeInterval = 30; }
        this.hierarchy = hierarchy;
        this.evictQueue = evictQueue;
        this.setStrategy = setStrategy;
        this.deleteStrategy = deleteStrategy;
        /**
         * Purge the cache of stale entries instead of waiting for a periodic check
         * @return A promise to track when the purge finishes
         */
        this.purge = function () {
            if (!_this.purgePromise) {
                AgingCache.logger.debug("Starting Purge: " + Date.now());
                _this.purgePromise = _this.purgeNext().then(function () { return (_this.purgePromise = undefined); });
            }
            return _this.purgePromise;
        };
        this.purgeInterval = purgeInterval * 1000;
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.purgeTimer = setInterval(this.purge, this.purgeInterval);
    }
    /**
     * Clean up the object when it's no longer used. After a dispose(), an object
     * is no longer guaranteed to be usable.
     */
    AgingCache.prototype.dispose = function () {
        AgingCache.logger.info("Cleaning up cache");
        if (this.purgeTimer) {
            clearInterval(this.purgeTimer);
            this.purgeTimer = undefined;
        }
        return this.purgePromise;
    };
    /**
     * @param key The key to retrieve
     * @returns The value if it's in the cache or undefined
     */
    AgingCache.prototype.get = function (key, force) {
        if (force === void 0) { force = false; }
        AgingCache.logger.debug("Getting Key: " + key);
        return this.hierarchy.getAtLevel(key, undefined, !force).then(function (agedValue) {
            if (agedValue) {
                return agedValue.value;
            }
            return null;
        });
    };
    /**
     * @param key The key to set
     * @param value The value to set
     * @returns If setting the value was successful
     */
    AgingCache.prototype.set = function (key, value, force) {
        if (force === void 0) { force = false; }
        AgingCache.logger.debug("Setting Key: " + key);
        if (this.evictQueue.isNextExpired()) {
            this.evict();
        }
        return this.setStrategy.set(key, value, force);
    };
    /**
     * @param key The key to the value to delete
     * @returns If deleting the value was successful
     */
    AgingCache.prototype.delete = function (key, force) {
        if (force === void 0) { force = false; }
        AgingCache.logger.debug("Deleting Key: " + key);
        return this.deleteStrategy.delete(key, force);
    };
    /**
     * @returns The keys that are currently in the cache
     */
    AgingCache.prototype.keys = function () {
        AgingCache.logger.debug("Getting Key List");
        return this.hierarchy.getKeysAtTopLevel();
    };
    AgingCache.prototype.purgeNext = function () {
        var _this = this;
        if (this.evictQueue.isNextExpired()) {
            return this.evict().then(function (status) {
                if (status === IAgingCache_1.AgingCacheWriteStatus.Success) {
                    return _this.purgeNext();
                }
            });
        }
        return Promise.resolve();
    };
    AgingCache.prototype.evict = function () {
        var nextKey = this.evictQueue.next();
        if (nextKey) {
            AgingCache.logger.debug("Evicting Key: " + nextKey);
            return this.delete(nextKey);
        }
        return Promise.resolve(IAgingCache_1.AgingCacheWriteStatus.UnspecifiedError);
    };
    AgingCache.logger = Logger_1.Logger.get(AgingCache.name);
    return AgingCache;
}());
exports.AgingCache = AgingCache;
//# sourceMappingURL=AgingCache.js.map