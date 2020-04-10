import { Logger } from "../../shared/Logger";
import { IAgedValue, IAgedQueue } from "../expire/IAgedQueue";
import { AgingCacheWriteStatus } from "../IAgingCache";
import { IStorageHierarchy } from "../../storage/IStorageHierarchy";

/**
 * Keep common methods and data for each set/delete strategy here
 */
export abstract class AgingCacheWriteStrategy<TKey, TValue> {
  protected static readonly logger = Logger.get('AgingCacheWriteStrategy');

  /**
   * @param hierarchy The storage hierarchy to operate on
   * @param evictQueue The keys in the order to evict
   */
  constructor(
    protected readonly hierarchy: IStorageHierarchy<TKey, TValue>,
    protected readonly evictQueue: IAgedQueue<TKey>) {}

  protected executeDelete = (key: TKey): Promise<AgingCacheWriteStatus> => {
    return this.hierarchy.deleteAtLevel(key)
      .then(status => {
        if (status === AgingCacheWriteStatus.Success) {
          this.evictQueue.delete(key);
        }
  
        return status;
      });
  }
  
  protected executeSet = (key: TKey, value: TValue): Promise<AgingCacheWriteStatus> => {
    const agedValue = {
      age: this.evictQueue.getInitialAge(key),
      value
    };
    return this.hierarchy.setAtLevel(key, agedValue)
      .then(status => {
        if (status === AgingCacheWriteStatus.Success) {
          this.evictQueue.addOrReplace(key, agedValue.age);
        }
  
        return status;
      });
  }

  protected setFromHighestLevel = (key: TKey, agedValue: IAgedValue<TValue>): Promise<AgingCacheWriteStatus> => {
    return this.hierarchy.setBelowTopLevel(key, agedValue)
      .then(status => {
        if (status === AgingCacheWriteStatus.Success) {
          this.evictQueue.addOrReplace(key, agedValue.age);
          return Promise.resolve(AgingCacheWriteStatus.Refreshed);
        }

        return Promise.resolve(AgingCacheWriteStatus.RefreshedError);
      });
  }
}
