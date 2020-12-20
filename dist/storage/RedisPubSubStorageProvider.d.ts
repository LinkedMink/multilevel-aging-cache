import { Redis } from "ioredis";
import { ISubscribableStorageProvider, StorageProviderUpdateHandler } from "./ISubscribableStorageProvider";
import { IRedisStorageProviderOptions } from "./IRedisStorageProviderOptions";
import { IAgedValue } from "../cache/expire/IAgedQueue";
/**
 * A storage provider that uses IORedis. This implemenation uses Redis pub/sub as a method to retrieve
 * updates from other nodes whenever keys change.
 */
export declare class RedisPubSubStorageProvider<TKey, TValue> implements ISubscribableStorageProvider<TKey, TValue> {
    private readonly client;
    private readonly channel?;
    private static readonly logger;
    private readonly keyPrefix;
    private readonly channelName;
    private readonly keySerializer;
    private readonly valueSerializer;
    private readonly updateHandlers;
    private isListening;
    /**
     * @param client The IORedis client for general read/write that has been initialized
     * @param config The set of options for the behavior of this storage provider
     * @param channel The IORedis client for listening to updates from other nodes that has been
     * initialized, undefined if subscribe/unsubscribe isn't needed.
     */
    constructor(client: Redis, config: IRedisStorageProviderOptions<TKey, TValue>, channel?: Redis | undefined);
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
    /**
     * Whenever a key/value changes, the storage provider can notify observers, so that
     * they can react accordingly. This will add the observer until an unsubscribe() is called
     * @param handler The function that will execute when a key/value changes
     * @return If subscribing to changes was successful
     */
    subscribe(handler: StorageProviderUpdateHandler<TKey, TValue>): boolean;
    /**
     * @param handler The function to remove
     * @return If unsubscribing to changes was successful
     */
    unsubscribe(handler: StorageProviderUpdateHandler<TKey, TValue>): boolean;
    /**
     * This should be called if subscribe/unsubscribe functionality is needed. channel
     * must be set in the constructor.
     * @return If subscribing the Redis channel was successful.
     */
    listen(): Promise<boolean>;
    private handleChannelMessage;
}
//# sourceMappingURL=RedisPubSubStorageProvider.d.ts.map