import { IAgingCacheSetStrategy } from "./IAgingCacheWriteStrategy";
import { AgingCacheWriteStatus } from "../IAgingCache";
import { AgingCacheWriteStrategy } from "./AgingCacheWriteStrategy";

/**
 * Strategy to overwrite only if we're forced to
 */
export class RefreshAlwaysSetStrategy<TKey, TValue>
  extends AgingCacheWriteStrategy<TKey, TValue>
  implements IAgingCacheSetStrategy<TKey, TValue> {
  set(
    key: TKey,
    value: TValue,
    force: boolean
  ): Promise<AgingCacheWriteStatus> {
    if (force) {
      return this.executeSet(key, value);
    }

    return this.hierarchy.getValueAtTopLevel(key).then(highestAgedValue => {
      if (!highestAgedValue) {
        return this.executeSet(key, value);
      }

      return this.hierarchy.getValueAtBottomLevel(key).then(lowestAgedValue => {
        if (
          lowestAgedValue &&
          this.evictQueue.compare(lowestAgedValue.age, highestAgedValue.age) ===
            0
        ) {
          return this.executeSet(key, value);
        }

        AgingCacheWriteStrategy.logger.debug(
          `Delete deferred: key=${key},ageToSet=${
            lowestAgedValue ? lowestAgedValue.age : "null"
          },ageFound=${highestAgedValue.age}`
        );
        return this.setFromHighestLevel(key, highestAgedValue);
      });
    });
  }
}
