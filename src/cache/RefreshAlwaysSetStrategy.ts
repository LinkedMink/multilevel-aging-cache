import { IAgingCacheSetStrategy } from "./IAgingCacheWriteStrategy";
import { IAgingCacheWrite } from "./IAgingCache";
import { AgingCacheWriteStrategy } from "./AgingCacheWriteStrategy";

/**
 * Strategy to overwrite only if we're forced to
 */
export class RefreshAlwaysSetStrategy<TKey, TValue>
  extends AgingCacheWriteStrategy<TKey, TValue>
  implements IAgingCacheSetStrategy<TKey, TValue> {
  set(key: TKey, value: TValue, force: boolean): Promise<IAgingCacheWrite<TValue>> {
    if (force) {
      return this.executeSet(key, value);
    }

    return this.setConditionally(key, value);
  }

  load(
    key: TKey,
    value: TValue,
    evictAtLevel?: number,
    force?: boolean
  ): Promise<IAgingCacheWrite<TValue>> {
    if (force) {
      return this.executeSet(key, value, evictAtLevel);
    }

    return this.setConditionally(key, value, evictAtLevel);
  }

  private setConditionally(
    key: TKey,
    value: TValue,
    evictAtLevel?: number
  ): Promise<IAgingCacheWrite<TValue>> {
    return this.hierarchy.getValueAtTopLevel(key).then(highestAgedValue => {
      if (!highestAgedValue) {
        return this.executeSet(key, value, evictAtLevel);
      }

      return this.hierarchy.getValueAtBottomLevel(key).then(lowestAgedValue => {
        if (
          lowestAgedValue &&
          this.evictQueue.compare(lowestAgedValue.age, highestAgedValue.age) === 0
        ) {
          return this.executeSet(key, value, evictAtLevel);
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
