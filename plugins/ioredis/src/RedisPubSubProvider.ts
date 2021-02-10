import { Cluster, Redis } from "ioredis";

import {
  ISubscribableStorageProvider,
  StorageProviderUpdateHandler,
  ISerializer,
  IAgedValue,
  Logger,
} from "@linkedmink/multilevel-aging-cache";
import { IRedisProviderOptions } from "./IRedisProviderOptions";

const RESPONSE_OK = "OK";
const DEFAULT_PUBLISH_CHANNEL = "PublishedKey";

interface IPublishDeleteMessage {
  key: string;
}

interface IPublishUpdateMessage extends IPublishDeleteMessage {
  age: number;
  value: string;
}

const isIPublishUpdateMessage = (value: unknown): value is IPublishUpdateMessage => {
  return (value as IPublishUpdateMessage).value !== undefined;
};

/**
 * A storage provider that uses IORedis. This implemenation uses Redis pub/sub as a method to retrieve
 * updates from other nodes whenever keys change.
 */
export class RedisPubSubProvider<TKey, TValue>
  implements ISubscribableStorageProvider<TKey, TValue> {
  readonly isPersistable: boolean;

  private readonly logger = Logger.get(RedisPubSubProvider.name);
  private readonly updateHandlers: StorageProviderUpdateHandler<TKey, TValue>[] = [];
  private readonly config: Required<IRedisProviderOptions<TKey, TValue>>;
  private isListening = false;

  /**
   * @param client The IORedis client for general read/write that has been initialized
   * @param channel The IORedis client for listening to updates from other nodes that has been
   * @param config The set of options for the behavior of this storage provider
   * initialized, undefined if subscribe/unsubscribe isn't needed.
   */
  constructor(
    private readonly client: Redis | Cluster,
    private readonly channel: Redis | Cluster,
    config: IRedisProviderOptions<TKey, TValue>
  ) {
    this.config = {
      ...config,
      channelName: config.channelName ?? config.keyPrefix + DEFAULT_PUBLISH_CHANNEL,
    };
    this.isPersistable = config.isPersistable;
  }

  /**
   * @param key The key to retrieve
   * @returns The value if retreiving was successful or null
   */
  get(key: TKey): Promise<IAgedValue<TValue> | null> {
    const serializedKey = this.config.keySerializer.serialize(key);
    return this.client.get(serializedKey).then(value => {
      if (!value) {
        return null;
      }

      const agedValue = JSON.parse(value) as IAgedValue<string>;
      return {
        age: agedValue.age,
        value: this.config.valueSerializer.deserialize(agedValue.value),
      };
    });
  }

  /**
   * @param key The key to set
   * @returns The value written if successful or null
   * @returns If setting the value was successful
   */
  set(key: TKey, agedValue: IAgedValue<TValue>): Promise<IAgedValue<TValue> | null> {
    const serializedKey = this.config.keySerializer.serialize(key);
    const serializedValue = this.config.valueSerializer.serialize(agedValue.value);
    const serializedAgeValue = JSON.stringify({
      age: agedValue.age,
      value: serializedValue,
    });

    return this.client.set(serializedKey, serializedAgeValue).then(response => {
      const isSuccessful = response === RESPONSE_OK;
      if (isSuccessful) {
        const message = JSON.stringify({
          key: serializedKey,
          age: agedValue.age,
          value: serializedValue,
        });
        return this.channel.publish(this.config.channelName, message).then(channelCount => {
          this.logger.debug(`Published Set: ${key}`);
          return agedValue;
        });
      }

      return isSuccessful ? agedValue : null;
    });
  }

  /**
   * @param key The key to the value to delete
   * @returns The value deleted or boolean (value | true is success). A provider
   * is not required to return a value
   */
  delete(key: TKey): Promise<IAgedValue<TValue> | boolean> {
    const serializedKey = this.config.keySerializer.serialize(key);
    return this.client.del(serializedKey).then(response => {
      const isSuccessful = response > 0;
      if (isSuccessful) {
        const message = JSON.stringify({ key: serializedKey });
        return this.channel.publish(this.config.channelName, message).then(channelCount => {
          this.logger.debug(`Published Delete: ${key}`);
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
      .keys(`${this.config.keyPrefix}*`)
      .then(keys => keys.map(this.config.keySerializer.deserialize));
  }

  /**
   * @returns The number of elements in this storage system
   */
  size(): Promise<number> {
    return this.client.keys(`${this.config.keyPrefix}*`).then(keys => keys.length);
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
      this.logger.warn("Attempted to subscribe function that is already subscribed");
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

    this.logger.warn("Attempted to unsubscribe with function that was never subscribed");
    return false;
  }

  /**
   * This should be called if subscribe/unsubscribe functionality is needed. channel
   * must be set in the constructor.
   * @return If subscribing the Redis channel was successful.
   */
  listen(): Promise<boolean> {
    if (this.isListening) {
      this.logger.warn("Attempted to listen when already listening");
      return Promise.resolve(false);
    }

    return this.channel.subscribe(this.config.channelName).then(subscribedCount => {
      if (subscribedCount < 1) {
        this.logger.error("Redis returned no channels are subscribed to");
        return false;
      }

      this.channel.on("message", this.handleChannelMessage);
      this.isListening = true;
      this.logger.info(
        `Listening to channel: ${this.config.channelName}, totalChannels=${subscribedCount}`
      );
      return true;
    });
  }

  private handleChannelMessage = (channel: string, message: string): void => {
    if (channel !== this.config.channelName) {
      this.logger.warn(`Message from foreign channel: ${channel}, message=${message}`);
      return;
    }

    this.logger.debug(`Received Message from ${channel}: ${message}`);
    const parsed = JSON.parse(message) as IPublishDeleteMessage;
    const key = this.config.keySerializer.deserialize(parsed.key);

    let agedValue: IAgedValue<TValue>;
    if (isIPublishUpdateMessage(parsed)) {
      agedValue = {
        age: parsed.age,
        value: this.config.valueSerializer.deserialize(parsed.value),
      };
    }

    this.updateHandlers.forEach(handler => handler(key, agedValue));
  };
}
