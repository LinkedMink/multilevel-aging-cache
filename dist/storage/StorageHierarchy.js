"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var IAgingCache_1 = require("../cache/IAgingCache");
var Logger_1 = require("../shared/Logger");
var IStorageHierarchy_1 = require("./IStorageHierarchy");
/**
 * The default storage hierarchy implementation relying on IStorageProvider for actual data access
 */
var StorageHierarchy = /** @class */ (function () {
    /**
     * @param levels The levels in the hierarchy with index 0 being the lowest level (first to read)
     * @param updatePolicy How updates from subscribed higher level storage providers should be handled
     */
    function StorageHierarchy(levels, updatePolicy) {
        if (updatePolicy === void 0) { updatePolicy = IStorageHierarchy_1.StorageHierarchyUpdatePolicy.OnlyIfKeyExist; }
        this.levels = levels;
        this.updatePolicy = updatePolicy;
        this.storageChangedHandlers = new Map();
        this.pendingUpdates = new Set();
        if (this.levels.length < 1) {
            throw new Error("StorageHierarchy must have at least one storage provider");
        }
        StorageHierarchy.logger.info("Created storage hierarchy with levels: " + this.levels.length);
        this.subscribeAtLevel(this.levels.length - 1);
    }
    /**
     * Clean up the object when it's no longer used. After a dispose(), an object
     * is no longer guaranteed to be usable.
     */
    StorageHierarchy.prototype.dispose = function () {
        var _this = this;
        this.storageChangedHandlers.forEach(function (handler, level) {
            _this.levels[level].unsubscribe(handler);
            _this.storageChangedHandlers.delete(level);
        });
        return Promise.all(this.pendingUpdates).then(function () { return undefined; });
    };
    /**
     * @param key The key to retrieve
     * @param level The level at which to retrieve the key
     * @param isAscending To go up the hierarchy (true) or down (false) from level
     * @returns The value if it's in the hierarchy from the level going up/down or null
     */
    StorageHierarchy.prototype.getAtLevel = function (key, level, isAscending) {
        var _this = this;
        if (isAscending === void 0) { isAscending = true; }
        var rLevel = this.getCurrentLevelOrNull(isAscending, level);
        if (rLevel === null) {
            return Promise.resolve(null);
        }
        return this.levels[rLevel].get(key)
            .then(function (agedValue) {
            if (agedValue) {
                return agedValue;
            }
            else {
                StorageHierarchy.logger.debug("Cache miss: level=" + rLevel + ", key=" + key);
                return _this.getAtLevel(key, isAscending ? rLevel + 1 : rLevel - 1, isAscending);
            }
        })
            .catch(function (error) {
            StorageHierarchy.logger.debug("Failed to Get: level=" + rLevel + ", key=" + key + ", error=" + error);
            return _this.getAtLevel(key, isAscending ? rLevel + 1 : rLevel - 1, isAscending);
        });
    };
    /**
     * @param key The key to set
     * @param value The value to set
     * @param level The level at which to set the key
     * @param isAscending To go up the hierarchy (true) or down (false) from level
     * @returns If the write succeeded to all levels going up/down or the error condition
     */
    StorageHierarchy.prototype.setAtLevel = function (key, value, level, isAscending) {
        var _this = this;
        if (isAscending === void 0) { isAscending = false; }
        var rLevel = this.getCurrentLevelOrNull(isAscending, level);
        if (rLevel === null) {
            return Promise.resolve(IAgingCache_1.AgingCacheWriteStatus.Success);
        }
        return this.levels[rLevel].set(key, value)
            .then(function (isSuccessful) {
            if (isSuccessful) {
                return _this.setAtLevel(key, value, isAscending ? rLevel + 1 : rLevel - 1, isAscending);
            }
            return _this.getErrorByLevelAndDirection(isAscending, rLevel);
        })
            .catch(function (error) {
            StorageHierarchy.logger.warn("Error setting: level=" + rLevel + ", key=" + key + ", error=" + error);
            return _this.getErrorByLevelAndDirection(isAscending, rLevel);
        });
    };
    /**
     * @param key The key to delete
     * @param level The level at which to delete the key
     * @param isAscending To go up the hierarchy (true) or down (false) from level
     * @returns If the write succeeded to all levels going up/down or the error condition
     */
    StorageHierarchy.prototype.deleteAtLevel = function (key, level, isAscending) {
        var _this = this;
        if (isAscending === void 0) { isAscending = false; }
        var rLevel = this.getCurrentLevelOrNull(isAscending, level);
        if (rLevel === null) {
            return Promise.resolve(IAgingCache_1.AgingCacheWriteStatus.Success);
        }
        return this.levels[rLevel].delete(key)
            .then(function (isSuccessful) {
            if (isSuccessful) {
                return _this.deleteAtLevel(key, rLevel - 1);
            }
            return _this.getErrorByLevelAndDirection(isAscending, rLevel);
        })
            .catch(function (error) {
            StorageHierarchy.logger.warn("Error deleting: level=" + rLevel + ", key=" + key + ", error=" + error);
            return _this.getErrorByLevelAndDirection(isAscending, rLevel);
        });
    };
    /**
     * @param level The level at which to search
     * @return The number of keys at the specified level
     */
    StorageHierarchy.prototype.getSizeAtLevel = function (level) {
        return this.levels[level].size();
    };
    /**
     * @returns The keys a the top level (should be all keys across the entire hierarchy)
     */
    StorageHierarchy.prototype.getKeysAtTopLevel = function () {
        return this.levels[this.levels.length - 1].keys();
    };
    /**
     * @param key The key to retrieve
     * @returns The value at the top level only or null
     */
    StorageHierarchy.prototype.getValueAtTopLevel = function (key) {
        return this.getAtLevel(key, this.levels.length - 1);
    };
    /**
     * @param key The key to retrieve
     * @returns The value at the bottom level only or null
     */
    StorageHierarchy.prototype.getValueAtBottomLevel = function (key) {
        return this.getAtLevel(key, 0, false);
    };
    /**
     * Set only the levels below the top level (for refresing from the top level for instance)
     * @param key The key to set
     * @param value The value to set
     * @returns If the write succeeded to all levels going up/down or the error condition
     */
    StorageHierarchy.prototype.setBelowTopLevel = function (key, value) {
        if (this.levels.length <= 1) {
            return Promise.resolve(IAgingCache_1.AgingCacheWriteStatus.Success);
        }
        return this.setAtLevel(key, value, this.levels.length - 2);
    };
    StorageHierarchy.prototype.subscribeAtLevel = function (level) {
        if (level <= 0) {
            return;
        }
        StorageHierarchy.logger.debug("subscribe to level: " + level);
        var nextLevel = level - 1;
        var handler = this.getUpdateHandlerAlways(nextLevel);
        if (this.updatePolicy === IStorageHierarchy_1.StorageHierarchyUpdatePolicy.OnlyIfKeyExist) {
            handler = this.getUpdateHandlerOnlyIfKeyExist(nextLevel, handler);
        }
        var wrappedHandler = this.getManagedPromiseSubscribe(handler);
        this.levels[level].subscribe(wrappedHandler);
        this.storageChangedHandlers.set(level, wrappedHandler);
        this.subscribeAtLevel(nextLevel);
    };
    StorageHierarchy.prototype.getCurrentLevelOrNull = function (isAscending, level) {
        level = level === undefined
            ? isAscending ? 0 : this.levels.length - 1
            : level;
        if (isAscending && level >= this.levels.length) {
            return null;
        }
        else if (!isAscending && level < 0) {
            return null;
        }
        else {
            return level;
        }
    };
    StorageHierarchy.prototype.getErrorByLevelAndDirection = function (isAscending, level) {
        if (isAscending && level === 0) {
            return IAgingCache_1.AgingCacheWriteStatus.UnspecifiedError;
        }
        else if (!isAscending && level === this.levels.length - 1) {
            return IAgingCache_1.AgingCacheWriteStatus.UnspecifiedError;
        }
        else {
            return IAgingCache_1.AgingCacheWriteStatus.PartialWrite;
        }
    };
    StorageHierarchy.prototype.getUpdateHandlerAlways = function (updateLevel) {
        var _this = this;
        return function (key, value) {
            if (value) {
                return _this.setAtLevel(key, value, updateLevel);
            }
            else {
                return _this.deleteAtLevel(key, updateLevel);
            }
        };
    };
    StorageHierarchy.prototype.getUpdateHandlerOnlyIfKeyExist = function (updateLevel, updateUnconditionally) {
        var _this = this;
        return function (key, value) {
            return _this.getAtLevel(key, updateLevel, false)
                .then(function (agedValue) {
                if (agedValue) {
                    if (value !== undefined && agedValue.age == value.age) {
                        return Promise.resolve(IAgingCache_1.AgingCacheWriteStatus.Success);
                    }
                    return updateUnconditionally(key, value);
                }
                StorageHierarchy.logger.debug("Key doesn't exist, ignoring subscribed update: " + key);
                return Promise.resolve(IAgingCache_1.AgingCacheWriteStatus.UnspecifiedError);
            });
        };
    };
    StorageHierarchy.prototype.getManagedPromiseSubscribe = function (func) {
        var _this = this;
        return function (key, value) {
            var promise = func(key, value).then(function () {
                _this.pendingUpdates.delete(promise);
            });
            _this.pendingUpdates.add(promise);
        };
    };
    StorageHierarchy.logger = Logger_1.Logger.get("StorageHierarchy");
    return StorageHierarchy;
}());
exports.StorageHierarchy = StorageHierarchy;
//# sourceMappingURL=StorageHierarchy.js.map