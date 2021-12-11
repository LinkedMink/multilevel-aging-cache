import { IStorageProvider } from './IStorageProvider';
import { AgedCompareFunc, compareAscending, IAgedValue } from '../queue/IAgedQueue';
import { Logger } from '../shared/Logger';
import { IDisposable } from '../shared/IDisposable';
import {
  IStorageHierarchy,
  StorageHierarchyUpdatePolicy,
  IStorageHierarchyWrite,
} from './IStorageHierarchy';
import {
  StorageProviderUpdateHandler,
  isISubscribableStorageProvider,
} from './ISubscribableStorageProvider';

type SubscriberUpdateHandler<TKey, TValue> = (
  key: TKey,
  value?: IAgedValue<TValue>
) => Promise<boolean>;

/**
 * The default storage hierarchy implementation relying on IStorageProvider for actual data access
 */
export class StorageHierarchy<TKey, TValue>
  implements IStorageHierarchy<TKey, TValue>, IDisposable
{
  readonly totalLevels = this.levels.length;
  readonly isPersistable = this.levels[this.totalLevels - 1].isPersistable;

  private readonly logger = Logger.get(StorageHierarchy.name);
  private readonly storageChangedHandlers = new Map<
    number,
    StorageProviderUpdateHandler<TKey, TValue>
  >();
  private readonly pendingUpdates: Set<Promise<void>> = new Set();
  private readonly topLevel = this.levels[this.totalLevels - 1];
  private readonly publishLevel?: number;

  /**
   * @param levels The levels in the hierarchy with index 0 being the lowest level (first to read)
   * @param updatePolicy How updates from subscribed higher level storage providers should be handled
   */
  constructor(
    private readonly levels: IStorageProvider<TKey, TValue>[],
    private readonly updatePolicy: StorageHierarchyUpdatePolicy = StorageHierarchyUpdatePolicy.OnlyIfKeyExist,
    private readonly ageCompareFunc: AgedCompareFunc = compareAscending
  ) {
    if (levels.length < 2) {
      throw new Error('StorageHierarchy must have at least 2 storage provider');
    }

    this.logger.info(`Created storage hierarchy with levels: ${this.totalLevels}`);
    this.publishLevel = this.subscribeAtLevel(this.totalLevels - 1);
  }

  /**
   * Clean up the object when it's no longer used. After a dispose(), an object
   * is no longer guaranteed to be usable.
   */
  public dispose(): Promise<void> {
    this.storageChangedHandlers.forEach((handler, level) => {
      const currentLevel = this.levels[level];
      if (isISubscribableStorageProvider(currentLevel)) {
        currentLevel.unsubscribe(handler);
      }

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
    isAscending = true
  ): Promise<IAgedValue<TValue> | null> {
    const rLevel = this.getCurrentLevelOrNull(isAscending, level);
    if (rLevel === null) {
      return Promise.resolve(null);
    }

    return this.levels[rLevel]
      .get(key)
      .then(agedValue => {
        if (agedValue) {
          return agedValue;
        } else {
          this.logger.debug(`Cache miss: level=${rLevel}, key=${key}`);
          return this.getAtLevel(key, isAscending ? rLevel + 1 : rLevel - 1, isAscending);
        }
      })
      .catch(error => {
        this.logger.debug(`Failed to Get: level=${rLevel}, key=${key}, error=${error}`);
        return this.getAtLevel(key, isAscending ? rLevel + 1 : rLevel - 1, isAscending);
      });
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
    isAscending = false
  ): Promise<IStorageHierarchyWrite<TValue>> {
    const rLevel = this.getCurrentLevelOrNull(isAscending, level);
    if (rLevel === null) {
      return Promise.resolve(this.getFullWriteStatus(value));
    }

    return this.levels[rLevel]
      .set(key, value)
      .then(valueWritten => {
        if (valueWritten !== null) {
          return this.setAtLevel(
            key,
            valueWritten,
            isAscending ? rLevel + 1 : rLevel - 1,
            isAscending
          );
        }

        return this.getPartialWriteStatus(isAscending, rLevel, value);
      })
      .catch(error => {
        this.logger.warn(`Error setting: level=${rLevel}, key=${key}, error=${error}`);
        return this.getPartialWriteStatus(isAscending, rLevel, value);
      });
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
    isAscending = false,
    writtenValue?: IAgedValue<TValue>
  ): Promise<IStorageHierarchyWrite<TValue>> {
    const rLevel = this.getCurrentLevelOrNull(isAscending, level);
    if (rLevel === null) {
      return Promise.resolve(this.getFullWriteStatus(writtenValue));
    }

    return this.levels[rLevel]
      .delete(key)
      .then(isSuccessful => {
        if (isSuccessful) {
          return this.deleteAtLevel(key, isAscending ? rLevel + 1 : rLevel - 1, isAscending);
        }

        return this.getPartialWriteStatus(isAscending, rLevel, writtenValue);
      })
      .catch(error => {
        this.logger.warn(`Error deleting: level=${rLevel}, key=${key}, error=${error}`);
        return this.getPartialWriteStatus(isAscending, rLevel, writtenValue);
      });
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
    return this.topLevel.keys();
  }

  /**
   * @param key The key to retrieve
   * @returns The value at the top level only or null
   */
  public getValueAtTopLevel(key: TKey): Promise<IAgedValue<TValue> | null> {
    return this.getAtLevel(key, this.totalLevels - 1);
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
  public setBelowTopLevel(
    key: TKey,
    value: IAgedValue<TValue>
  ): Promise<IStorageHierarchyWrite<TValue>> {
    return this.setAtLevel(key, value, this.totalLevels - 2);
  }

  private subscribeAtLevel(level: number, publishLevel?: number): number | undefined {
    if (level <= 0) {
      return publishLevel;
    }

    const nextLevel = level - 1;

    const currentLevel = this.levels[level];
    if (isISubscribableStorageProvider(currentLevel)) {
      this.logger.debug(`subscribe to level: ${level}`);

      let handler = this.getUpdateHandlerAlways(nextLevel);
      if (this.updatePolicy === StorageHierarchyUpdatePolicy.OnlyIfKeyExist) {
        handler = this.getUpdateHandlerOnlyIfKeyExist(nextLevel, handler);
      }

      const wrappedHandler = this.getManagedPromiseSubscribe(handler);
      currentLevel.subscribe(wrappedHandler);
      this.storageChangedHandlers.set(level, wrappedHandler);

      if (!publishLevel) {
        publishLevel = level;
      }
    }

    return this.subscribeAtLevel(nextLevel, publishLevel);
  }

  private getCurrentLevelOrNull(isAscending: boolean, level?: number): number | null {
    level = level === undefined ? (isAscending ? 0 : this.totalLevels - 1) : level;

    if (isAscending && level >= this.totalLevels) {
      return null;
    } else if (!isAscending && level < 0) {
      return null;
    } else {
      return level;
    }
  }

  private getUpdateHandlerAlways(updateLevel: number) {
    return (key: TKey, value?: IAgedValue<TValue>): Promise<boolean> => {
      if (value) {
        return this.setAtLevel(key, value, updateLevel).then(
          s => s.writtenLevels === this.totalLevels
        );
      } else {
        return this.deleteAtLevel(key, updateLevel).then(s => s.writtenLevels === this.totalLevels);
      }
    };
  }

  private getUpdateHandlerOnlyIfKeyExist(
    updateLevel: number,
    updateUnconditionally: SubscriberUpdateHandler<TKey, TValue>
  ) {
    return (key: TKey, value?: IAgedValue<TValue>): Promise<boolean> => {
      return this.getAtLevel(key, updateLevel, false).then(agedValue => {
        if (agedValue) {
          if (value !== undefined && this.ageCompareFunc(agedValue.age, value.age) >= 0) {
            return Promise.resolve(true);
          }
          return updateUnconditionally(key, value);
        }
        this.logger.debug(`Key doesn't exist, ignoring subscribed update: ${key}`);
        return Promise.resolve(false);
      });
    };
  }

  private getManagedPromiseSubscribe(func: SubscriberUpdateHandler<TKey, TValue>) {
    return (key: TKey, value?: IAgedValue<TValue>): void => {
      const promise = func(key, value).then(() => {
        this.pendingUpdates.delete(promise);
      });
      this.pendingUpdates.add(promise);
    };
  }

  private getPartialWriteStatus(
    isAscending: boolean,
    level: number,
    value?: IAgedValue<TValue>
  ): IStorageHierarchyWrite<TValue> {
    const writtenLevels = isAscending ? level : this.totalLevels - level - 1;
    return {
      isPersisted: !isAscending && level <= this.totalLevels - 2 && this.topLevel.isPersistable,
      isPublished:
        this.publishLevel !== undefined &&
        (isAscending ? level > this.publishLevel : level < this.publishLevel),
      writtenLevels,
      writtenValue: writtenLevels !== 0 ? value : undefined,
    };
  }

  private getFullWriteStatus(value?: IAgedValue<TValue>): IStorageHierarchyWrite<TValue> {
    return {
      isPersisted: this.topLevel.isPersistable,
      isPublished: this.publishLevel !== undefined,
      writtenLevels: this.totalLevels,
      writtenValue: value,
    };
  }
}
