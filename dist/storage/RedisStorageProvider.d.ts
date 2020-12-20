import { Redis, Cluster } from "ioredis";
import { IStorageProvider } from "./IStorageProvider";
import { IRedisStorageProviderOptions } from "./IRedisStorageProviderOptions";
import { IAgedValue } from "../cache/expire/IAgedQueue";
/**
 * A storage provider that uses IORedis. This implemenation uses Redis pub/sub as a method to retrieve
 * updates from other nodes whenever keys change.
 */
export declare class RedisStorageProvider<TKey, TValue> implements IStorageProvider<TKey, TValue> {
    private readonly client;
    private readonly keyPrefix;
    private readonly keySerializer;
    private readonly valueSerializer;
    /**
     * @param client The IORedis client for general read/write that has been initialized
     * @param config The set of options for the behavior of this storage provider
     * @param channel The IORedis client for listening to updates from other nodes that has been
     * initialized, undefined if subscribe/unsubscribe isn't needed.
     */
    constructor(client: Redis | Cluster, config: IRedisStorageProviderOptions<TKey, TValue>);
    /**
     * @param key The key to retrieve
     * @returns The value if retreiving was successful or null
     */
    get(key: TKey): Promise<IAgedValue<TValue> | null>;
    /**
     * @param key The key to set
     * @param value The value to set
     * @returns If setting the value was successful
     */
    set(key: TKey, agedValue: IAgedValue<TValue>): Promise<boolean>;
    /**
     * @param key The key to the value to delete
     * @returns If deleting the value was successful
     */
    delete(key: TKey): Promise<boolean>;
    /**
     * @returns The keys that are currently available in the provider
     */
    keys(): Promise<TKey[]>;
    /**
     * @returns The number of elements in this storage system
     */
    size(): Promise<number>;
}
//# sourceMappingURL=RedisStorageProvider.d.ts.map