import { IAgedValue } from "../cache/expire/IAgedQueue";

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
}
