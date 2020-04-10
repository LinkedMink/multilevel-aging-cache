import { IAgingCacheDeleteStrategy } from "./IAgingCacheWriteStrategy";
import { AgingCacheWriteStatus } from "../IAgingCache";
import { AgingCacheWriteStrategy } from "./AgingCacheWriteStrategy";

/**
 * Strategy to overwrite only if we're forced to
 */
export class RefreshAlwaysDeleteStrategy<TKey, TValue> 
  extends AgingCacheWriteStrategy<TKey, TValue> implements IAgingCacheDeleteStrategy<TKey> {
    
  delete(key: TKey, force: boolean): Promise<AgingCacheWriteStatus> {
    if (force) {
      return this.executeDelete(key);
    }

    return this.hierarchy.getValueAtTopLevel(key)
      .then(highestAgedValue => {
        if (!highestAgedValue) {
          return this.executeDelete(key);
        }

        return this.hierarchy.getValueAtBottomLevel(key)
          .then(lowestAgedValue => {
            if (lowestAgedValue && this.evictQueue.compare(lowestAgedValue.age, highestAgedValue.age) === 0) {
              return this.executeDelete(key);
            }
        
            AgingCacheWriteStrategy.logger.debug(
              `Delete deferred: key=${key},ageToSet=${lowestAgedValue ? lowestAgedValue.age : 'null'},ageFound=${highestAgedValue.age}`)
            return this.setFromHighestLevel(key, highestAgedValue);
          });
      });
  }
}