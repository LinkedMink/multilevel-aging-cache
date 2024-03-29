import { IAgingCacheSetStrategy } from './IAgingCacheWriteStrategy';
import { IAgingCacheWrite } from './IAgingCache';
import { AgingCacheWriteStrategy } from './AgingCacheWriteStrategy';

/**
 * Strategy to overwrite only if our value is newer than the high level
 */
export class OverwriteAgedSetStrategy<TKey, TValue>
  extends AgingCacheWriteStrategy<TKey, TValue>
  implements IAgingCacheSetStrategy<TKey, TValue>
{
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
    const currentAge = this.evictQueue.getInitialAge(key);
    return this.hierarchy.getValueAtTopLevel(key).then(highestAgedValue => {
      if (!highestAgedValue || this.evictQueue.compare(highestAgedValue.age, currentAge) <= 0) {
        return this.executeSet(key, value, evictAtLevel);
      }

      this.logger.debug(
        `Set deferred: key=${key},ageToSet=${currentAge},ageFound=${highestAgedValue.age}`
      );
      return this.setFromHighestLevel(key, highestAgedValue);
    });
  }
}
