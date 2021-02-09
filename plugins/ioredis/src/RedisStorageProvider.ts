import { Redis, Cluster } from "ioredis";

import { IStorageProvider, ISerializer, IAgedValue } from "@linkedmink/multilevel-aging-cache";
import { IRedisStorageProviderOptions } from "./IRedisStorageProviderOptions";

const RESPONSE_OK = "OK";

/**
 * A storage provider that uses IORedis. This implemenation uses Redis pub/sub as a method to retrieve
 * updates from other nodes whenever keys change.
 */
export class RedisStorageProvider<TKey, TValue> implements IStorageProvider<TKey, TValue> {
  readonly isPersistable: boolean;

  private readonly keyPrefix: string;
  private readonly keySerializer: ISerializer<TKey>;
  private readonly valueSerializer: ISerializer<TValue>;

  /**
   * @param client The IORedis client for general read/write that has been initialized
   * @param config The set of options for the behavior of this storage provider
   */
  constructor(
    private readonly client: Redis | Cluster,
    config: IRedisStorageProviderOptions<TKey, TValue>
  ) {
    this.keyPrefix = config.keyPrefix;
    this.keySerializer = config.keySerializer;
    this.valueSerializer = config.valueSerializer;
    this.isPersistable = config.isPersistable;
  }

  /**
   * @param key The key to retrieve
   * @returns The value if retreiving was successful or null
   */
  get(key: TKey): Promise<IAgedValue<TValue> | null> {
    const serializedKey = this.keySerializer.serialize(key);
    return this.client.get(serializedKey).then(value => {
      if (!value) {
        return null;
      }

      const agedValue = JSON.parse(value) as IAgedValue<string>;
      return {
        age: agedValue.age,
        value: this.valueSerializer.deserialize(agedValue.value),
      };
    });
  }

  /**
   * @param key The key to set
   * @param value The value to set
   * @returns The value written if successful or null
   */
  set(key: TKey, agedValue: IAgedValue<TValue>): Promise<IAgedValue<TValue> | null> {
    const serializedKey = this.keySerializer.serialize(key);
    const serializedValue = this.valueSerializer.serialize(agedValue.value);
    const serializedAgeValue = JSON.stringify({
      age: agedValue.age,
      value: serializedValue,
    });

    return this.client.set(serializedKey, serializedAgeValue).then(response => {
      return response === RESPONSE_OK ? agedValue : null;
    });
  }

  /**
   * @param key The key to the value to delete
   * @returns The value deleted or boolean (value | true is success). A provider
   * is not required to return a value
   */
  delete(key: TKey): Promise<IAgedValue<TValue> | boolean> {
    const serializedKey = this.keySerializer.serialize(key);
    return this.client.del(serializedKey).then(response => {
      return response > 0;
    });
  }

  /**
   * @returns The keys that are currently available in the provider
   */
  keys(): Promise<TKey[]> {
    return this.client
      .keys(`${this.keyPrefix}*`)
      .then(keys => keys.map(this.keySerializer.deserialize));
  }

  /**
   * @returns The number of elements in this storage system
   */
  size(): Promise<number> {
    return this.client.keys(`${this.keyPrefix}*`).then(keys => keys.length);
  }
}
