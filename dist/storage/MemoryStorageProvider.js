"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryStorageProvider = void 0;
var Logger_1 = require("../shared/Logger");
/**
 * A key/value storage system for local memory. This is essentially a wrapper of a Map
 */
var MemoryStorageProvider = /** @class */ (function () {
    function MemoryStorageProvider() {
        this.data = new Map();
        this.ages = new Map();
    }
    /**
     * @param key The key to retrieve
     * @returns The value if retreiving was successful or null
     */
    MemoryStorageProvider.prototype.get = function (key) {
        var localValue = this.data.get(key);
        if (localValue !== undefined) {
            var age = this.ages.get(key);
            return Promise.resolve({
                value: localValue,
                age: age ? age : 0,
            });
        }
        else {
            MemoryStorageProvider.logger.debug("Attempted to get key that doesn't exist: " + key);
            return Promise.resolve(null);
        }
    };
    /**
     * @param key The key to set
     * @param value The value to set
     * @returns If setting the value was successful
     */
    MemoryStorageProvider.prototype.set = function (key, agedValue) {
        this.data.set(key, agedValue.value);
        this.ages.set(key, agedValue.age);
        return Promise.resolve(true);
    };
    /**
     * @param key The key to the value to delete
     * @returns If deleting the value was successful
     */
    MemoryStorageProvider.prototype.delete = function (key) {
        var isDeleted = this.data.delete(key);
        this.ages.delete(key);
        if (!isDeleted) {
            MemoryStorageProvider.logger.debug("Attempted to delete key that doesn't exist: " + key);
        }
        return Promise.resolve(isDeleted);
    };
    /**
     * @returns The keys that are currently available in the provider
     */
    MemoryStorageProvider.prototype.keys = function () {
        var keys = Array.from(this.data.keys());
        return Promise.resolve(keys);
    };
    /**
     * @returns The number of elements in this storage system
     */
    MemoryStorageProvider.prototype.size = function () {
        return Promise.resolve(this.data.size);
    };
    MemoryStorageProvider.logger = Logger_1.Logger.get(MemoryStorageProvider.name);
    return MemoryStorageProvider;
}());
exports.MemoryStorageProvider = MemoryStorageProvider;
//# sourceMappingURL=MemoryStorageProvider.js.map