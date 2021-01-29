import { IDisposable } from "../shared/IDisposable";
import { IAgingCache, AgingCacheWriteStatus } from "./IAgingCache";
import { IAgedQueue } from "./expire/IAgedQueue";
import { Logger } from "../shared/Logger";
import { IStorageHierarchy } from "../storage/IStorageHierarchy";
import {
  IAgingCacheDeleteStrategy,
  IAgingCacheSetStrategy,
} from "./write/IAgingCacheWriteStrategy";

/**
 * A cache that will replace entries in the order specified by the input IAgedQueue
 */
export class AgingCache<TKey, TValue>
  implements IAgingCache<TKey, TValue>, IDisposable {
  private readonly logger = Logger.get(AgingCache.name);
  private readonly purgeInterval: number;
  private purgeTimer?: NodeJS.Timeout;
  private purgePromise?: Promise<void>;

  /**
   * @param hierarchy The storage hierarchy to operate on
   * @param evictQueue The keys in the order to evict
   * @param setStrategy The implementation for setting keys
   * @param deleteStrategy The implementation for deleting keys
   * @param purgeInterval The interval to check for old entries in seconds
   */
  constructor(
    private readonly hierarchy: IStorageHierarchy<TKey, TValue>,
    private readonly evictQueue: IAgedQueue<TKey>,
    private readonly setStrategy: IAgingCacheSetStrategy<TKey, TValue>,
    private readonly deleteStrategy: IAgingCacheDeleteStrategy<TKey>,
    private readonly evictAtLevel?: number,
    purgeInterval = 30
  ) {
    this.purgeInterval = purgeInterval * 1000;

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.purgeTimer = setInterval(this.purge, this.purgeInterval);
  }

  /**
   * Clean up the object when it's no longer used. After a dispose(), an object
   * is no longer guaranteed to be usable.
   */
  public dispose(): Promise<void> | void {
    this.logger.info(`Cleaning up cache`);

    if (this.purgeTimer) {
      clearInterval(this.purgeTimer);
      this.purgeTimer = undefined;
    }

    return this.purgePromise;
  }

  /**
   * @param key The key to retrieve
   * @returns The value if it's in the cache or undefined
   */
  public get(key: TKey, force = false): Promise<TValue | null> {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    this.logger.debug(`Getting Key: ${key}`);
    return this.hierarchy.getAtLevel(key, undefined, !force).then(agedValue => {
      if (agedValue) {
        return agedValue.value;
      }

      return null;
    });
  }

  /**
   * @param key The key to set
   * @param value The value to set
   * @returns If setting the value was successful
   */
  public set(
    key: TKey,
    value: TValue,
    force = false
  ): Promise<AgingCacheWriteStatus> {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    this.logger.debug(`Setting Key: ${key}`);
    if (this.evictQueue.isNextExpired()) {
      void this.evict();
    }

    return this.setStrategy.set(key, value, force);
  }

  /**
   * @param key The key to the value to delete
   * @returns If deleting the value was successful
   */
  public delete(key: TKey, force = false): Promise<AgingCacheWriteStatus> {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    this.logger.debug(`Deleting Key: ${key}`);
    return this.deleteStrategy.delete(key, force);
  }

  /**
   * @returns The keys that are currently in the cache
   */
  public keys(): Promise<TKey[]> {
    this.logger.debug("Getting Key List");
    return this.hierarchy.getKeysAtTopLevel();
  }

  /**
   * Purge the cache of stale entries instead of waiting for a periodic check
   * @return A promise to track when the purge finishes
   */
  public purge = (): Promise<void> => {
    if (!this.purgePromise) {
      this.logger.debug(`Starting Purge: ${Date.now()}`);
      this.purgePromise = this.purgeNext().then(
        () => (this.purgePromise = undefined)
      );
    }

    return this.purgePromise;
  };

  private purgeNext(): Promise<void> {
    if (this.evictQueue.isNextExpired()) {
      return this.evict().then(status => {
        if (status === AgingCacheWriteStatus.Success) {
          return this.purgeNext();
        }
      });
    }

    return Promise.resolve();
  }

  private evict(): Promise<AgingCacheWriteStatus> {
    const nextKey = this.evictQueue.next();
    if (nextKey) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.logger.debug(`Evicting Key: ${nextKey}`);
      return this.deleteStrategy.evict(nextKey, this.evictAtLevel);
    }

    return Promise.resolve(AgingCacheWriteStatus.UnspecifiedError);
  }
}
