import { IAgedValue } from "../cache/expire/IAgedQueue";
/**
 * A function to execute when a IStorageProvider key/value changes. Used with subscribe/unsubscribe
 * @param key The key that was set/delete
 * @param value The value that was set or undefined if it was a delete
 */
export declare type StorageProviderUpdateHandler<TKey, TValue> = (key: TKey, value?: IAgedValue<TValue>) => void;
/**
 * Represents a key/value storage system
 */
export interface IStorageProvider<TKey, TValue> {
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
    set(key: TKey, value: IAgedValue<TValue>): Promise<boolean>;
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
//# sourceMappingURL=IStorageProvider.d.ts.map