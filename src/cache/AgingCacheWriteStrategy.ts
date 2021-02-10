import { Logger } from "../shared/Logger";
import { IAgedValue, IAgedQueue } from "../queue/IAgedQueue";
import { AgingCacheWriteStatus, IAgingCacheWrite } from "./IAgingCache";
import { IStorageHierarchy, IStorageHierarchyWrite } from "../storage/IStorageHierarchy";

/**
 * Keep common methods and data for each set/delete strategy here
 */
export abstract class AgingCacheWriteStrategy<TKey, TValue> {
  protected readonly logger = Logger.get(AgingCacheWriteStrategy.name);

  /**
   * @param hierarchy The storage hierarchy to operate on
   * @param evictQueue The keys in the order to evict
   */
  constructor(
    protected readonly hierarchy: IStorageHierarchy<TKey, TValue>,
    protected readonly evictQueue: IAgedQueue<TKey>
  ) {}

  protected executeDelete = (key: TKey, level?: number): Promise<IAgingCacheWrite<TValue>> => {
    return this.hierarchy.deleteAtLevel(key, level).then(status => {
      const write = this.getWriteStatus(status, level);
      if (write.status === AgingCacheWriteStatus.Success) {
        this.evictQueue.delete(key);
      }

      return write;
    });
  };

  protected executeSet = (
    key: TKey,
    value: TValue,
    level?: number
  ): Promise<IAgingCacheWrite<TValue>> => {
    const agedValue = {
      age: this.evictQueue.getInitialAge(key),
      value,
    };
    return this.hierarchy.setAtLevel(key, agedValue, level).then(status => {
      const write = this.getWriteStatus(status, level);
      if (write.status === AgingCacheWriteStatus.Success) {
        this.evictQueue.addOrReplace(key, agedValue.age);
      }

      return write;
    });
  };

  protected setFromHighestLevel = (
    key: TKey,
    agedValue: IAgedValue<TValue>
  ): Promise<IAgingCacheWrite<TValue>> => {
    return this.hierarchy.setBelowTopLevel(key, agedValue).then(status => {
      if (status.writtenLevels === this.hierarchy.totalLevels - 1) {
        this.evictQueue.addOrReplace(key, agedValue.age);
        return Promise.resolve<IAgingCacheWrite<TValue>>({
          status: AgingCacheWriteStatus.Refreshed,
          value: status.writtenValue?.value,
        });
      }

      return Promise.resolve({
        status: AgingCacheWriteStatus.RefreshedError,
        value: status.writtenValue?.value,
      });
    });
  };

  protected getWriteStatus(
    status: IStorageHierarchyWrite<TValue>,
    level?: number
  ): IAgingCacheWrite<TValue> {
    const expectedWritten = level ? level + 1 : this.hierarchy.totalLevels;
    return {
      status:
        status.writtenLevels === expectedWritten
          ? AgingCacheWriteStatus.Success
          : status.writtenLevels === 0
          ? AgingCacheWriteStatus.UnspecifiedError
          : AgingCacheWriteStatus.PartialWrite,
      value: status.writtenValue?.value,
    };
  }
}
