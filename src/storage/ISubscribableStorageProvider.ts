import { IStorageProvider } from "./IStorageProvider";
import { IAgedValue } from "../cache/expire/IAgedQueue";

/**
 * A function to execute when a IStorageProvider key/value changes. Used with subscribe/unsubscribe
 * @param key The key that was set/delete
 * @param value The value that was set or undefined if it was a delete
 */
export type StorageProviderUpdateHandler<TKey, TValue> = (
  key: TKey,
  value?: IAgedValue<TValue>
) => void;

/**
 * A storage provider that can propogate changes through the cluster. In a distributed system where
 * data is partially stored at the node level, some systems require a mechanism to sychronize writes.
 */
export interface ISubscribableStorageProvider<TKey, TValue>
  extends IStorageProvider<TKey, TValue> {
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

export function isISubscribableStorageProvider<TKey, TValue>(
  provider: IStorageProvider<TKey, TValue>
): provider is ISubscribableStorageProvider<TKey, TValue> {
  return (
    (provider as ISubscribableStorageProvider<TKey, TValue>).subscribe !==
    undefined
  );
}
