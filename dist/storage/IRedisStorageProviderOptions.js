"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StringSerializer_1 = require("../serialization/StringSerializer");
var JsonSerializer_1 = require("../serialization/JsonSerializer");
var DEFAULT_KEY_PREFIX = 'node';
/**
 * @param keyPrefix The Redis key prefix that should match that used with the IORedis client
 * @return Options to construct a Redis storage provider with string keys and JSON object values
 */
function getStringKeyJsonValueOptions(keyPrefix) {
    var prefix = keyPrefix
        ? keyPrefix
        : DEFAULT_KEY_PREFIX + Math.round(Math.random() * 1000000);
    return {
        keyPrefix: prefix,
        keySerializer: new StringSerializer_1.StringSerializer(),
        valueSerializer: new JsonSerializer_1.JsonSerializer()
    };
}
exports.getStringKeyJsonValueOptions = getStringKeyJsonValueOptions;
//# sourceMappingURL=IRedisStorageProviderOptions.js.map