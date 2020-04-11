import { IStorageProvider, StorageProviderUpdateHandler } from "./IStorageProvider";
import { IAgedValue } from "../cache/expire/IAgedQueue";
/**
 * A key/value storage system for local memory. This is essentially a wrapper of a Map
 */
export declare class MemoryStorageProvider<TKey, TValue> implements IStorageProvider<TKey, TValue> {
    private static readonly logger;
    private readonly data;
    private readonly ages;
    private readonly updateHandlers;
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
}
//# sourceMappingURL=MemoryStorageProvider.d.ts.map