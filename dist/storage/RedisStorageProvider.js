"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Logger_1 = require("../shared/Logger");
var RESPONSE_OK = "OK";
var DEFAULT_PUBLISH_CHANNEL = "PublishedKey";
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
    function RedisStorageProvider(client, config, channel) {
        var _this = this;
        this.client = client;
        this.channel = channel;
        this.updateHandlers = [];
        this.isListening = false;
        this.handleChannelMessage = function (channel, message) {
            if (channel !== _this.channelName) {
                RedisStorageProvider.logger.warn("Message from foreign channel: " + channel + ", message=" + message);
                return;
            }
            RedisStorageProvider.logger.debug("Received Message from " + channel + ": " + message);
            var parsed = JSON.parse(message);
            var key = _this.keySerializer.deserialize(parsed.key);
            var agedValue;
            if (parsed.value) {
                agedValue = {
                    age: parsed.age,
                    value: _this.valueSerializer.deserialize(parsed.value)
                };
            }
            _this.updateHandlers.forEach(function (handler) { return handler(key, agedValue); });
        };
        this.keyPrefix = config.keyPrefix;
        this.keySerializer = config.keySerializer;
        this.valueSerializer = config.valueSerializer;
        this.channelName = config.channelName
            ? config.channelName
            : this.keyPrefix + DEFAULT_PUBLISH_CHANNEL;
    }
    /**
     * @param key The key to retrieve
     * @returns The value if retreiving was successful or null
     */
    RedisStorageProvider.prototype.get = function (key) {
        var _this = this;
        var serializedKey = this.keySerializer.serialize(key);
        return this.client.get(serializedKey)
            .then(function (value) {
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
        var _this = this;
        var serializedKey = this.keySerializer.serialize(key);
        var serializedValue = this.valueSerializer.serialize(agedValue.value);
        var serializedAgeValue = JSON.stringify({
            age: agedValue.age,
            value: serializedValue
        });
        return this.client.set(serializedKey, serializedAgeValue)
            .then(function (response) {
            var isSuccessful = response === RESPONSE_OK;
            if (_this.channel && isSuccessful) {
                var message = JSON.stringify({ key: serializedKey, age: agedValue.age, value: serializedValue });
                return _this.channel.publish(_this.channelName, message)
                    .then(function (channelCount) {
                    RedisStorageProvider.logger.debug("Published Set: " + key);
                    return true;
                });
            }
            return isSuccessful;
        });
    };
    /**
     * @param key The key to the value to delete
     * @returns If deleting the value was successful
     */
    RedisStorageProvider.prototype.delete = function (key) {
        var _this = this;
        var serializedKey = this.keySerializer.serialize(key);
        return this.client.del(serializedKey)
            .then(function (response) {
            var isSuccessful = response > 0;
            if (_this.channel && isSuccessful) {
                var message = JSON.stringify({ key: serializedKey });
                return _this.channel.publish(_this.channelName, message)
                    .then(function (channelCount) {
                    RedisStorageProvider.logger.debug("Published Delete: " + key);
                    return true;
                });
            }
            return isSuccessful;
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
        return this.client
            .keys(this.keyPrefix + "*")
            .then(function (keys) { return keys.length; });
    };
    /**
     * Whenever a key/value changes, the storage provider can notify observers, so that
     * they can react accordingly. This will add the observer until an unsubscribe() is called
     * @param handler The function that will execute when a key/value changes
     * @return If subscribing to changes was successful
     */
    RedisStorageProvider.prototype.subscribe = function (handler) {
        var index = this.updateHandlers.indexOf(handler);
        if (index >= 0) {
            RedisStorageProvider.logger.warn("Attempted to subscribe function that is already subscribed");
            return false;
        }
        this.updateHandlers.push(handler);
        return true;
    };
    /**
     * @param handler The function to remove
     * @return If unsubscribing to changes was successful
     */
    RedisStorageProvider.prototype.unsubscribe = function (handler) {
        var index = this.updateHandlers.indexOf(handler);
        if (index >= 0) {
            this.updateHandlers.splice(index, 1);
            return true;
        }
        RedisStorageProvider.logger.warn("Attempted to unsubscribe with function that was never subscribed");
        return false;
    };
    /**
     * This should be called if subscribe/unsubscribe functionality is needed. channel
     * must be set in the constructor.
     * @return If subscribing the Redis channel was successful.
     */
    RedisStorageProvider.prototype.listen = function () {
        var _this = this;
        if (!this.channel) {
            RedisStorageProvider.logger.warn("Attempted to listen when not provided a channel in constructor");
            return Promise.resolve(false);
        }
        else if (this.isListening) {
            RedisStorageProvider.logger.warn("Attempted to listen when already listening");
            return Promise.resolve(false);
        }
        return this.channel.subscribe(this.channelName)
            .then(function (subscribedCount) {
            if (subscribedCount < 1) {
                RedisStorageProvider.logger.error("Redis returned no channels are subscribed to");
                return false;
            }
            _this.channel.on("message", _this.handleChannelMessage);
            _this.isListening = true;
            RedisStorageProvider.logger.info("Listening to channel: " + _this.channelName + ", totalChannels=" + subscribedCount);
            return true;
        });
    };
    RedisStorageProvider.logger = Logger_1.Logger.get('RedisStorageProvider');
    return RedisStorageProvider;
}());
exports.RedisStorageProvider = RedisStorageProvider;
//# sourceMappingURL=RedisStorageProvider.js.map