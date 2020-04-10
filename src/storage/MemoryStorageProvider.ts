import { IStorageProvider, StorageProviderUpdateHandler } from "./IStorageProvider";
import { IAgedValue } from "../cache/expire/IAgedQueue";
import { Logger } from "../shared/Logger";

/**
 * A key/value storage system for local memory. This is essentially a wrapper of a Map
 */
export class MemoryStorageProvider<TKey, TValue> implements IStorageProvider<TKey, TValue> {
  private static readonly logger = Logger.get("MemoryStorageProvider");
  private readonly data: Map<TKey, TValue> = new Map();
  private readonly ages: Map<TKey, number> = new Map();
  private readonly updateHandlers: StorageProviderUpdateHandler<TKey, TValue>[] = [];

  /**
   * @param key The key to retrieve
   * @returns The value if retreiving was successful or null
   */
  get(key: TKey): Promise<IAgedValue<TValue> | null> {
    const localValue = this.data.get(key);
    if (localValue !== undefined) {
      const age = this.ages.get(key);
      return Promise.resolve({
        value: localValue,
        age: age ? age : 0
      });
    } else {
      MemoryStorageProvider.logger.debug(`Attempted to get key that doesn't exist: ${key}`);
      return Promise.resolve(null);
    }
  }

  /**
   * @param key The key to set
   * @param value The value to set
   * @returns If setting the value was successful
   */
  set(key: TKey, agedValue: IAgedValue<TValue>): Promise<boolean> {
    this.data.set(key, agedValue.value);
    this.ages.set(key, agedValue.age);
    this.updateHandlers.forEach(handler => handler(key, agedValue));
    return Promise.resolve(true);
  }

  /**
   * @param key The key to the value to delete
   * @returns If deleting the value was successful
   */
  delete(key: TKey): Promise<boolean> {
    const isDeleted = this.data.delete(key);
    this.ages.delete(key);
    if (isDeleted) {
      this.updateHandlers.forEach(handler => handler(key));
    } else {
      MemoryStorageProvider.logger.debug(`Attempted to delete key that doesn't exist: ${key}`);
    }

    return Promise.resolve(isDeleted);
  }

  /**
   * @returns The keys that are currently available in the provider
   */
  keys(): Promise<TKey[]> {
    const keys = Array.from(this.data.keys());
    return Promise.resolve(keys);
  }

  /**
   * @returns The number of elements in this storage system
   */
  size(): Promise<number> {
    return Promise.resolve(this.data.size);
  }
  
  /**
   * Whenever a key/value changes, the storage provider can notify observers, so that
   * they can react accordingly. This will add the observer until an unsubscribe() is called
   * @param handler The function that will execute when a key/value changes
   * @return If subscribing to changes was successful
   */
  subscribe(handler: StorageProviderUpdateHandler<TKey, TValue>): boolean {
    const index = this.updateHandlers.indexOf(handler);
    if (index >= 0) {
      MemoryStorageProvider.logger.warn("Attempted to subscribe function that is already subscribed");
      return false;
    }

    this.updateHandlers.push(handler);
    return true;
  }

  /**
   * @param handler The function to remove
   * @return If unsubscribing to changes was successful
   */
  unsubscribe(handler: StorageProviderUpdateHandler<TKey, TValue>): boolean {
    const index = this.updateHandlers.indexOf(handler);
    if (index >= 0) {
      this.updateHandlers.splice(index, 1);
      return true;
    }
    
    MemoryStorageProvider.logger.warn("Attempted to unsubscribe with function that was never subscribed");
    return false;
  }
}
