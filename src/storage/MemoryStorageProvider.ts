import { IAgedValue } from "../cache/expire/IAgedQueue";
import { Logger } from "../shared/Logger";
import { IStorageProvider } from "./IStorageProvider";

/**
 * A key/value storage system for local memory. This is essentially a wrapper of a Map
 */
export class MemoryStorageProvider<TKey, TValue>
  implements IStorageProvider<TKey, TValue> {
  private static readonly logger = Logger.get(MemoryStorageProvider.name);
  private readonly data = new Map<TKey, TValue>();
  private readonly ages = new Map<TKey, number>();

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
        age: age ? age : 0,
      });
    } else {
      MemoryStorageProvider.logger.debug(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `Attempted to get key that doesn't exist: ${key}`
      );
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
    return Promise.resolve(true);
  }

  /**
   * @param key The key to the value to delete
   * @returns If deleting the value was successful
   */
  delete(key: TKey): Promise<boolean> {
    const isDeleted = this.data.delete(key);
    this.ages.delete(key);
    if (!isDeleted) {
      MemoryStorageProvider.logger.debug(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `Attempted to delete key that doesn't exist: ${key}`
      );
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
}
