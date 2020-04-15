import { Redis } from "ioredis";

import { ISubscribableStorageProvider, StorageProviderUpdateHandler } from "./ISubscribableStorageProvider";
import { ISerializer } from "../serialization/ISerializer";
import { IRedisStorageProviderOptions } from "./IRedisStorageProviderOptions";
import { IAgedValue } from "../cache/expire/IAgedQueue";
import { Logger } from "../shared/Logger";

const RESPONSE_OK = "OK";
const DEFAULT_PUBLISH_CHANNEL = "PublishedKey"

/**
 * A storage provider that uses IORedis. This implemenation uses Redis pub/sub as a method to retrieve
 * updates from other nodes whenever keys change.
 */
export class RedisPubSubStorageProvider<TKey, TValue> implements ISubscribableStorageProvider<TKey, TValue> {
  private static readonly logger = Logger.get('RedisStorageProvider');
  private readonly keyPrefix: string;
  private readonly channelName: string;
  private readonly keySerializer: ISerializer<TKey>;
  private readonly valueSerializer: ISerializer<TValue>;
  private readonly updateHandlers: StorageProviderUpdateHandler<TKey, TValue>[] = [];
  private isListening = false;

  /**
   * @param client The IORedis client for general read/write that has been initialized
   * @param config The set of options for the behavior of this storage provider
   * @param channel The IORedis client for listening to updates from other nodes that has been 
   * initialized, undefined if subscribe/unsubscribe isn't needed.
   */
  constructor(
    private readonly client: Redis,
    config: IRedisStorageProviderOptions<TKey, TValue>,
    private readonly channel?: Redis) {
    
    this.keyPrefix = config.keyPrefix;
    this.keySerializer = config.keySerializer;
    this.valueSerializer = config.valueSerializer;
    this.channelName = config.channelName 
      ? config.channelName
      : this.keyPrefix + DEFAULT_PUBLISH_CHANNEL;
  }

  /**
   * @param key The key to retrieve
   * @returns The value if retreiving was successful or null
   */
  get(key: TKey): Promise<IAgedValue<TValue> | null> {
    const serializedKey = this.keySerializer.serialize(key);
    return this.client.get(serializedKey)
      .then(value => {
        if (!value) {
          return null;
        }

        const agedValue = JSON.parse(value);
        agedValue.value = this.valueSerializer.deserialize(agedValue.value);
        return agedValue;
      });
  }

  /**
   * @param key The key to set
   * @param value The value to set
   * @returns If setting the value was successful
   */
  set(key: TKey, agedValue: IAgedValue<TValue>): Promise<boolean> {
    const serializedKey = this.keySerializer.serialize(key);
    const serializedValue = this.valueSerializer.serialize(agedValue.value);
    const serializedAgeValue = JSON.stringify({
      age: agedValue.age,
      value: serializedValue
    });

    return this.client.set(serializedKey, serializedAgeValue)
      .then(response => {
        const isSuccessful = response === RESPONSE_OK;
        if (this.channel && isSuccessful) {
          const message = JSON.stringify({ key: serializedKey, age: agedValue.age, value: serializedValue });
          return this.channel.publish(this.channelName, message)
            .then(channelCount => {
              RedisPubSubStorageProvider.logger.debug(`Published Set: ${key}`)
              return true;
            });
        }

        return isSuccessful;
      });
  }

  /**
   * @param key The key to the value to delete
   * @returns If deleting the value was successful
   */
  delete(key: TKey): Promise<boolean> {
    const serializedKey = this.keySerializer.serialize(key);
    return this.client.del(serializedKey)
      .then(response => {
        const isSuccessful = response > 0;
        if (this.channel && isSuccessful) {
          const message = JSON.stringify({ key: serializedKey });
          return this.channel.publish(this.channelName, message)
          .then(channelCount => {
            RedisPubSubStorageProvider.logger.debug(`Published Delete: ${key}`)
            return true;
          });
        }

        return isSuccessful;
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
    return this.client
      .keys(`${this.keyPrefix}*`)
      .then(keys => keys.length);
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
      RedisPubSubStorageProvider.logger.warn("Attempted to subscribe function that is already subscribed");
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

    RedisPubSubStorageProvider.logger.warn("Attempted to unsubscribe with function that was never subscribed");
    return false;
  }

  /**
   * This should be called if subscribe/unsubscribe functionality is needed. channel
   * must be set in the constructor.
   * @return If subscribing the Redis channel was successful.
   */
  listen(): Promise<boolean> {
    if (!this.channel) {
      RedisPubSubStorageProvider.logger.warn("Attempted to listen when not provided a channel in constructor");
      return Promise.resolve(false);
    } else if (this.isListening) {
      RedisPubSubStorageProvider.logger.warn("Attempted to listen when already listening");
      return Promise.resolve(false);
    }

    return this.channel.subscribe(this.channelName)
      .then(subscribedCount => {
        if (subscribedCount < 1) {
          RedisPubSubStorageProvider.logger.error("Redis returned no channels are subscribed to");
          return false;
        }

        (this.channel as Redis).on("message", this.handleChannelMessage);
        this.isListening = true;
        RedisPubSubStorageProvider.logger.info(`Listening to channel: ${this.channelName}, totalChannels=${subscribedCount}`);
        return true;
      });
  }

  private handleChannelMessage = (channel: string, message: string): void => {
    if (channel !== this.channelName) {
      RedisPubSubStorageProvider.logger.warn(`Message from foreign channel: ${channel}, message=${message}`);
      return;
    }

    RedisPubSubStorageProvider.logger.debug(`Received Message from ${channel}: ${message}`)
    const parsed = JSON.parse(message);
    const key = this.keySerializer.deserialize(parsed.key);
    
    let agedValue: IAgedValue<TValue>;
    if (parsed.value) {
      agedValue = {
        age: parsed.age,
        value: this.valueSerializer.deserialize(parsed.value)
      }
    }

    this.updateHandlers.forEach(handler => handler(key, agedValue));
  }
}
