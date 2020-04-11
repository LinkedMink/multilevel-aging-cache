"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Logger_1 = require("../shared/Logger");
/**
 * A key/value storage system for local memory. This is essentially a wrapper of a Map
 */
var MemoryStorageProvider = /** @class */ (function () {
    function MemoryStorageProvider() {
        this.data = new Map();
        this.ages = new Map();
        this.updateHandlers = [];
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
                age: age ? age : 0
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
        this.updateHandlers.forEach(function (handler) { return handler(key, agedValue); });
        return Promise.resolve(true);
    };
    /**
     * @param key The key to the value to delete
     * @returns If deleting the value was successful
     */
    MemoryStorageProvider.prototype.delete = function (key) {
        var isDeleted = this.data.delete(key);
        this.ages.delete(key);
        if (isDeleted) {
            this.updateHandlers.forEach(function (handler) { return handler(key); });
        }
        else {
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
    /**
     * Whenever a key/value changes, the storage provider can notify observers, so that
     * they can react accordingly. This will add the observer until an unsubscribe() is called
     * @param handler The function that will execute when a key/value changes
     * @return If subscribing to changes was successful
     */
    MemoryStorageProvider.prototype.subscribe = function (handler) {
        var index = this.updateHandlers.indexOf(handler);
        if (index >= 0) {
            MemoryStorageProvider.logger.warn("Attempted to subscribe function that is already subscribed");
            return false;
        }
        this.updateHandlers.push(handler);
        return true;
    };
    /**
     * @param handler The function to remove
     * @return If unsubscribing to changes was successful
     */
    MemoryStorageProvider.prototype.unsubscribe = function (handler) {
        var index = this.updateHandlers.indexOf(handler);
        if (index >= 0) {
            this.updateHandlers.splice(index, 1);
            return true;
        }
        MemoryStorageProvider.logger.warn("Attempted to unsubscribe with function that was never subscribed");
        return false;
    };
    MemoryStorageProvider.logger = Logger_1.Logger.get("MemoryStorageProvider");
    return MemoryStorageProvider;
}());
exports.MemoryStorageProvider = MemoryStorageProvider;
//# sourceMappingURL=MemoryStorageProvider.js.map