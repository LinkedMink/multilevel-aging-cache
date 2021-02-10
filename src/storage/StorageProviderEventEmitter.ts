import { EventEmitter } from "events";
import { IAgedValue } from "../queue/IAgedQueue";
import { IStorageProvider } from "./IStorageProvider";

export enum StorageProviderEvent {
  Set = "StorageProviderSet",
  Delete = "StorageProviderDelete",
}

/**
 * Allow listening on Set and Delete events on a specific storage layer
 */
export class StorageProviderEventEmitter<TKey, TValue>
  extends EventEmitter
  implements IStorageProvider<TKey, TValue> {
  readonly isPersistable = false;

  /**
   * @param provider The IStorageProvider to augment by emitting events
   * @param isSetEmit If StorageProviderEvent.Set will be emitted
   * @param isDeleteEmit If StorageProviderEvent.Delete will be emitted
   */
  constructor(
    private readonly provider: IStorageProvider<TKey, TValue>,
    private readonly isSetEmit: boolean = true,
    private readonly isDeleteEmit: boolean = true
  ) {
    super();
  }

  /**
   * @param key The key to retrieve
   * @returns The value if retreiving was successful or null
   */
  get = this.provider.get.bind(this.provider);

  /**
   * @param key The key to set
   * @param value The value to set
   * @returns The value written if successful or null
   */
  set(key: TKey, agedValue: IAgedValue<TValue>): Promise<IAgedValue<TValue> | null> {
    const promise = this.provider.set(key, agedValue);
    if (this.isSetEmit) {
      return promise.then(result => {
        this.emit(StorageProviderEvent.Set, result);
        return result;
      });
    } else {
      return promise;
    }
  }

  /**
   * @param key The key to the value to delete
   * @returns The value deleted or boolean (value | true is success). A provider
   * is not required to return a value
   */
  delete(key: TKey): Promise<IAgedValue<TValue> | boolean> {
    const promise = this.provider.delete(key);
    if (this.isDeleteEmit) {
      return promise.then(result => {
        this.emit(StorageProviderEvent.Delete, result);
        return result;
      });
    } else {
      return promise;
    }
  }

  /**
   * @returns The keys that are currently available in the provider
   */
  keys = this.provider.keys.bind(this.provider);

  /**
   * @returns The number of elements in this storage system
   */
  size = this.provider.size.bind(this.provider);
}
