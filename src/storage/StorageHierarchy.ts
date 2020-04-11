import { IStorageProvider, StorageProviderUpdateHandler } from "./IStorageProvider";
import { IAgedValue } from "../cache/expire/IAgedQueue";
import { AgingCacheWriteStatus } from "../cache/IAgingCache";
import { Logger } from "../shared/Logger";
import { IDisposable } from "../shared/IDisposable";
import { IStorageHierarchy, StorageHierarchyUpdatePolicy } from "./IStorageHierarchy";

type SubscriberUpdateHandler<TKey, TValue> = (key: TKey, value?: IAgedValue<TValue>) => Promise<AgingCacheWriteStatus>

/**
 * The default storage hierarchy implementation relying on IStorageProvider for actual data access
 */
export class StorageHierarchy<TKey, TValue> implements IStorageHierarchy<TKey, TValue>, IDisposable {
  private static readonly logger = Logger.get("StorageHierarchy");
  private readonly storageChangedHandlers: Map<number, StorageProviderUpdateHandler<TKey, TValue>> = new Map();
  private readonly pendingUpdates: Set<Promise<void>> = new Set()

  /**
   * @param levels The levels in the hierarchy with index 0 being the lowest level (first to read)
   * @param updatePolicy How updates from subscribed higher level storage providers should be handled
   */
  constructor(
    private readonly levels: IStorageProvider<TKey, TValue>[],
    private readonly updatePolicy: StorageHierarchyUpdatePolicy = StorageHierarchyUpdatePolicy.OnlyIfKeyExist) {

    if (this.levels.length < 1) {
      throw new Error("StorageHierarchy must have at least one storage provider");
    }

    StorageHierarchy.logger.info(`Created storage hierarchy with levels: ${this.levels.length}`);
    this.subscribeAtLevel(this.levels.length - 1);
  }

  /**
   * Clean up the object when it's no longer used. After a dispose(), an object 
   * is no longer guaranteed to be usable.
   */
  public dispose(): Promise<void> {
    this.storageChangedHandlers.forEach((handler, level) => {
      this.levels[level].unsubscribe(handler);
      this.storageChangedHandlers.delete(level);
    });

    return Promise.all(this.pendingUpdates).then(() => undefined);
  }

  /**
   * @param key The key to retrieve
   * @param level The level at which to retrieve the key
   * @param isAscending To go up the hierarchy (true) or down (false) from level
   * @returns The value if it's in the hierarchy from the level going up/down or null
   */
  public getAtLevel(
    key: TKey, 
    level?: number,
    isAscending = true): Promise<IAgedValue<TValue> | null> {
    
    const rLevel = this.getCurrentLevelOrNull(isAscending, level);
    if (rLevel === null) {
      return Promise.resolve(null);
    }
  
    return this.levels[rLevel].get(key)
      .then(agedValue => {
        if (agedValue) {
          return agedValue;
        } else {
          StorageHierarchy.logger.debug(`Cache miss: level=${rLevel}, key=${key}`);
          return this.getAtLevel(key, isAscending ? rLevel + 1 : rLevel - 1, isAscending);
        }
      })
      .catch(error => {
        StorageHierarchy.logger.debug(`Failed to Get: level=${rLevel}, key=${key}, error=${error}`);
        return this.getAtLevel(key, isAscending ? rLevel + 1 : rLevel - 1, isAscending);
      })
  }
  
  /**
   * @param key The key to set
   * @param value The value to set
   * @param level The level at which to set the key
   * @param isAscending To go up the hierarchy (true) or down (false) from level
   * @returns If the write succeeded to all levels going up/down or the error condition
   */
  public setAtLevel(
    key: TKey, 
    value: IAgedValue<TValue>, 
    level?: number,
    isAscending = false): Promise<AgingCacheWriteStatus> {
  
    const rLevel = this.getCurrentLevelOrNull(isAscending, level);
    if (rLevel === null) {
      return Promise.resolve(AgingCacheWriteStatus.Success);
    }
  
    return this.levels[rLevel].set(key, value)
      .then(isSuccessful => {
        if (isSuccessful) {
          return this.setAtLevel(key, value, isAscending ? rLevel + 1 : rLevel - 1, isAscending);
        } 
  
        return this.getErrorByLevelAndDirection(isAscending, rLevel);
      })
      .catch(error => {
        StorageHierarchy.logger.warn(`Error setting: level=${rLevel}, key=${key}, error=${error}`);
        return this.getErrorByLevelAndDirection(isAscending, rLevel);
      })
  }
  
  /**
   * @param key The key to delete
   * @param level The level at which to delete the key
   * @param isAscending To go up the hierarchy (true) or down (false) from level
   * @returns If the write succeeded to all levels going up/down or the error condition
   */
  public deleteAtLevel( 
    key: TKey, 
    level?: number,
    isAscending = false): Promise<AgingCacheWriteStatus> {
  
    const rLevel = this.getCurrentLevelOrNull(isAscending, level);
    if (rLevel === null) {
      return Promise.resolve(AgingCacheWriteStatus.Success);
    }
  
    return this.levels[rLevel].delete(key)
      .then(isSuccessful => {
        if (isSuccessful) {
          return this.deleteAtLevel(key, rLevel - 1);
        } 
  
        return this.getErrorByLevelAndDirection(isAscending, rLevel);
      })
      .catch(error => {
        StorageHierarchy.logger.warn(`Error deleting: level=${rLevel}, key=${key}, error=${error}`);
        return this.getErrorByLevelAndDirection(isAscending, rLevel);
      })
  }

  /**
   * @param level The level at which to search
   * @return The number of keys at the specified level
   */
  public getSizeAtLevel(level: number): Promise<number> {
    return this.levels[level].size();
  }

  /**
   * @returns The keys a the top level (should be all keys across the entire hierarchy)
   */
  public getKeysAtTopLevel(): Promise<TKey[]> {
    return this.levels[this.levels.length - 1].keys();
  }

  /**
   * @param key The key to retrieve
   * @returns The value at the top level only or null
   */
  public getValueAtTopLevel(key: TKey): Promise<IAgedValue<TValue> | null> {
    return this.getAtLevel(key, this.levels.length - 1);
  }

  /**
   * @param key The key to retrieve
   * @returns The value at the bottom level only or null
   */
  public getValueAtBottomLevel(key: TKey): Promise<IAgedValue<TValue> | null> {
    return this.getAtLevel(key, 0, false);
  }

  /**
   * Set only the levels below the top level (for refresing from the top level for instance)
   * @param key The key to set
   * @param value The value to set
   * @returns If the write succeeded to all levels going up/down or the error condition
   */
  public setBelowTopLevel(key: TKey, value: IAgedValue<TValue>): Promise<AgingCacheWriteStatus> {
    if (this.levels.length <= 1) {
      return Promise.resolve(AgingCacheWriteStatus.Success);
    }

    return this.setAtLevel(key, value, this.levels.length - 2);
  }

  private subscribeAtLevel(level: number): void {
    if (level <= 0) {
      return;
    }

    StorageHierarchy.logger.debug(`subscribe to level: ${level}`);

    const nextLevel = level - 1;
    let handler = this.getUpdateHandlerAlways(nextLevel);
    if (this.updatePolicy === StorageHierarchyUpdatePolicy.OnlyIfKeyExist) {
      handler = this.getUpdateHandlerOnlyIfKeyExist(nextLevel, handler);
    }

    const wrappedHandler = this.getManagedPromiseSubscribe(handler);
    this.levels[level].subscribe(wrappedHandler);
    this.storageChangedHandlers.set(level, wrappedHandler);
    this.subscribeAtLevel(nextLevel);
  }

  private getCurrentLevelOrNull(isAscending: boolean, level?: number): number | null {
    level = level === undefined 
      ? isAscending ? 0 : this.levels.length - 1
      : level
  
    if (isAscending && level >= this.levels.length) {
      return null;
    } else if (!isAscending  && level < 0) {
      return null;
    } else {
      return level;
    }
  }
  
  private getErrorByLevelAndDirection(isAscending: boolean, level: number): AgingCacheWriteStatus {
    if (isAscending && level === 0) {
      return AgingCacheWriteStatus.UnspecifiedError;
    } else if (!isAscending  && level === this.levels.length - 1) {
      return AgingCacheWriteStatus.UnspecifiedError;
    } else {
      return AgingCacheWriteStatus.PartialWrite;
    }
  }

  private getUpdateHandlerAlways(updateLevel: number) {
    return (key: TKey, value?: IAgedValue<TValue>): Promise<AgingCacheWriteStatus> => {
      if (value) {
        return this.setAtLevel(key, value, updateLevel);
      } else {
        return this.deleteAtLevel(key, updateLevel);
      }
    };
  }

  private getUpdateHandlerOnlyIfKeyExist(updateLevel: number, updateUnconditionally: SubscriberUpdateHandler<TKey, TValue>) {
    return (key: TKey, value?: IAgedValue<TValue>): Promise<AgingCacheWriteStatus> => {
      return this.getAtLevel(key, updateLevel, false)
        .then(agedValue => {
          if (agedValue) {
            if (value !== undefined && agedValue.age == value.age) {
              return Promise.resolve(AgingCacheWriteStatus.Success);
            }
            return updateUnconditionally(key, value);
          }
          StorageHierarchy.logger.debug(`Key doesn't exist, ignoring subscribed update: ${key}`)
          return Promise.resolve(AgingCacheWriteStatus.UnspecifiedError);
        })
    };
  }

  private getManagedPromiseSubscribe(func: SubscriberUpdateHandler<TKey, TValue>) {
    return (key: TKey, value?: IAgedValue<TValue>): void => {
      const promise = func(key, value).then(() => {
        this.pendingUpdates.delete(promise);
      })
      this.pendingUpdates.add(promise);
    };
  }
}
