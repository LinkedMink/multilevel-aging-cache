import { IAgingCacheSetStrategy } from "./IAgingCacheWriteStrategy";
import { IAgingCacheWrite } from "../IAgingCache";
import { AgingCacheWriteStrategy } from "./AgingCacheWriteStrategy";

/**
 * Strategy to overwrite regardless of the higher level value
 */
export class OverwriteAlwaysSetStrategy<TKey, TValue>
  extends AgingCacheWriteStrategy<TKey, TValue>
  implements IAgingCacheSetStrategy<TKey, TValue> {
  set(key: TKey, value: TValue, force: boolean): Promise<IAgingCacheWrite<TValue>> {
    return this.executeSet(key, value);
  }

  load(
    key: TKey,
    value: TValue,
    evictAtLevel?: number,
    force?: boolean
  ): Promise<IAgingCacheWrite<TValue>> {
    return this.executeSet(key, value, evictAtLevel);
  }
}
