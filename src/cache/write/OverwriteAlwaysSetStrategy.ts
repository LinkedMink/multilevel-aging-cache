import { IAgingCacheSetStrategy } from "./IAgingCacheWriteStrategy";
import { AgingCacheWriteStatus } from "../IAgingCache";
import { AgingCacheWriteStrategy } from "./AgingCacheWriteStrategy";

/**
 * Strategy to overwrite regardless of the higher level value
 */
export class OverwriteAlwaysSetStrategy<TKey, TValue>
  extends AgingCacheWriteStrategy<TKey, TValue>
  implements IAgingCacheSetStrategy<TKey, TValue> {
  set(
    key: TKey,
    value: TValue,
    force: boolean
  ): Promise<AgingCacheWriteStatus> {
    return this.executeSet(key, value);
  }
}
