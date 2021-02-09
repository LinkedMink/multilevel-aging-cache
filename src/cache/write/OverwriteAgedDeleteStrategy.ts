import { IAgingCacheDeleteStrategy } from "./IAgingCacheWriteStrategy";
import { IAgingCacheWrite } from "../IAgingCache";
import { AgingCacheWriteStrategy } from "./AgingCacheWriteStrategy";

/**
 * Strategy to overwrite only if our value is newer than the high level
 */
export class OverwriteAgedDeleteStrategy<TKey, TValue>
  extends AgingCacheWriteStrategy<TKey, TValue>
  implements IAgingCacheDeleteStrategy<TKey, TValue> {
  delete(key: TKey, force: boolean): Promise<IAgingCacheWrite<TValue>> {
    if (force) {
      return this.executeDelete(key);
    }

    return this.deleteConditionally(key);
  }

  evict(key: TKey, evictAtLevel?: number, force?: boolean): Promise<IAgingCacheWrite<TValue>> {
    if (force) {
      return this.executeDelete(key, evictAtLevel);
    }

    return this.deleteConditionally(key, evictAtLevel);
  }

  private deleteConditionally(key: TKey, evictAtLevel?: number): Promise<IAgingCacheWrite<TValue>> {
    return this.hierarchy.getValueAtTopLevel(key).then(highestAgedValue => {
      if (!highestAgedValue) {
        return this.executeDelete(key, evictAtLevel);
      }

      return this.hierarchy.getValueAtBottomLevel(key).then(lowestAgedValue => {
        if (
          lowestAgedValue &&
          this.evictQueue.compare(lowestAgedValue.age, highestAgedValue.age) >= 0
        ) {
          return this.executeDelete(key, evictAtLevel);
        }

        this.logger.debug(
          `Delete deferred: key=${key},ageToSet=${
            lowestAgedValue ? lowestAgedValue.age : "null"
          },ageFound=${highestAgedValue.age}`
        );
        return this.setFromHighestLevel(key, highestAgedValue);
      });
    });
  }
}
