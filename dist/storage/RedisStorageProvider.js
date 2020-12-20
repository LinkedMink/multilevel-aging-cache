"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisStorageProvider = void 0;
var RESPONSE_OK = "OK";
/**
 * A storage provider that uses IORedis. This implemenation uses Redis pub/sub as a method to retrieve
 * updates from other nodes whenever keys change.
 */
var RedisStorageProvider = /** @class */ (function () {
    /**
     * @param client The IORedis client for general read/write that has been initialized
     * @param config The set of options for the behavior of this storage provider
     * @param channel The IORedis client for listening to updates from other nodes that has been
     * initialized, undefined if subscribe/unsubscribe isn't needed.
     */
    function RedisStorageProvider(client, config) {
        this.client = client;
        this.keyPrefix = config.keyPrefix;
        this.keySerializer = config.keySerializer;
        this.valueSerializer = config.valueSerializer;
    }
    /**
     * @param key The key to retrieve
     * @returns The value if retreiving was successful or null
     */
    RedisStorageProvider.prototype.get = function (key) {
        var _this = this;
        var serializedKey = this.keySerializer.serialize(key);
        return this.client.get(serializedKey).then(function (value) {
            if (!value) {
                return null;
            }
            var agedValue = JSON.parse(value);
            agedValue.value = _this.valueSerializer.deserialize(agedValue.value);
            return agedValue;
        });
    };
    /**
     * @param key The key to set
     * @param value The value to set
     * @returns If setting the value was successful
     */
    RedisStorageProvider.prototype.set = function (key, agedValue) {
        var serializedKey = this.keySerializer.serialize(key);
        var serializedValue = this.valueSerializer.serialize(agedValue.value);
        var serializedAgeValue = JSON.stringify({
            age: agedValue.age,
            value: serializedValue,
        });
        return this.client.set(serializedKey, serializedAgeValue).then(function (response) {
            return response === RESPONSE_OK;
        });
    };
    /**
     * @param key The key to the value to delete
     * @returns If deleting the value was successful
     */
    RedisStorageProvider.prototype.delete = function (key) {
        var serializedKey = this.keySerializer.serialize(key);
        return this.client.del(serializedKey).then(function (response) {
            return response > 0;
        });
    };
    /**
     * @returns The keys that are currently available in the provider
     */
    RedisStorageProvider.prototype.keys = function () {
        var _this = this;
        return this.client
            .keys(this.keyPrefix + "*")
            .then(function (keys) { return keys.map(_this.keySerializer.deserialize); });
    };
    /**
     * @returns The number of elements in this storage system
     */
    RedisStorageProvider.prototype.size = function () {
        return this.client.keys(this.keyPrefix + "*").then(function (keys) { return keys.length; });
    };
    return RedisStorageProvider;
}());
exports.RedisStorageProvider = RedisStorageProvider;
//# sourceMappingURL=RedisStorageProvider.js.map