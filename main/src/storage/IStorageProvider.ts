import { IAgedValue } from '../queue/IAgedQueue';

/**
 * Represents a key/value storage system
 */
export interface IStorageProvider<TKey, TValue> {
  /**
   * @returns If this storage layer can be used for permenant storage
   */
  readonly isPersistable: boolean;

  /**
   * @param key The key to retrieve
   * @returns The value if retreiving was successful or null
   */
  get(key: TKey): Promise<IAgedValue<TValue> | null>;

  /**
   * @param key The key to set
   * @param value The value to set
   * @returns The value written if successful or null
   */
  set(key: TKey, value: IAgedValue<TValue>): Promise<IAgedValue<TValue> | null>;

  /**
   * @param key The key to the value to delete
   * @returns The value deleted or boolean (value | true is success). A provider
   * is not required to return a value
   */
  delete(key: TKey): Promise<IAgedValue<TValue> | boolean>;

  /**
   * @returns The keys that are currently available in the provider
   */
  keys(): Promise<TKey[]>;

  /**
   * @returns The number of elements in this storage system
   */
  size(): Promise<number>;
}
