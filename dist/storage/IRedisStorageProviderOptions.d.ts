import { ISerializer } from "../serialization/ISerializer";
/**
 * Options to build a RedisStorageProvider
 */
export interface IRedisStorageProviderOptions<TKey, TValue> {
    /**
     * The storage provider uses IORedis which sets its own key prefix. This is still needed
     * to build queries, so it should be the same as the prefix to build the Redis client.
     */
    keyPrefix: string;
    /**
     * If an object is used as a key, a needs to be converted to a string for storage in Redis.
     * This is the method to convert the key, or use StringSerializer if the key is a string
     */
    keySerializer: ISerializer<TKey>;
    /**
     * If an object is used as a value, a needs to be converted to a string for storage in Redis.
     * This is the method to convert the value, or use StringSerializer if the value is a string
     */
    valueSerializer: ISerializer<TValue>;
    /**
     * The name of the Redis pub/sub channel to use for key/value updates or default if undefined
     */
    channelName?: string;
}
/**
 * @param keyPrefix The Redis key prefix that should match that used with the IORedis client
 * @return Options to construct a Redis storage provider with string keys and JSON object values
 */
export declare function getStringKeyJsonValueOptions(keyPrefix?: string): IRedisStorageProviderOptions<string, object>;
//# sourceMappingURL=IRedisStorageProviderOptions.d.ts.map