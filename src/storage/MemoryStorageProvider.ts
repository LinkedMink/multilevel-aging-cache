import { IAgedValue } from "../queue/IAgedQueue";
import { IStorageProvider } from "./IStorageProvider";

/**
 * A key/value storage system for local memory. This is essentially a wrapper of a Map
 */
export class MemoryStorageProvider<TKey, TValue> implements IStorageProvider<TKey, TValue> {
  private readonly data = new Map<TKey, IAgedValue<TValue>>();

  readonly isPersistable = false;

  /**
   * @param key The key to retrieve
   * @returns The value if retreiving was successful or null
   */
  get(key: TKey): Promise<IAgedValue<TValue> | null> {
    const value = this.data.get(key);
    return Promise.resolve(value ?? null);
  }

  /**
   * @param key The key to set
   * @param value The value to set
   * @returns The value written if successful or null
   */
  set(key: TKey, agedValue: IAgedValue<TValue>): Promise<IAgedValue<TValue> | null> {
    this.data.set(key, agedValue);
    return Promise.resolve(agedValue);
  }

  /**
   * @param key The key to the value to delete
   * @returns The value deleted or boolean (value | true is success). A provider
   * is not required to return a value
   */
  delete(key: TKey): Promise<IAgedValue<TValue> | boolean> {
    const kv = this.data.get(key);
    return Promise.resolve(this.data.delete(key) ? (kv as IAgedValue<TValue>) : false);
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
