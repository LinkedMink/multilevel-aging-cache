import { IAgingCacheDeleteStrategy } from "./IAgingCacheWriteStrategy";
import { AgingCacheWriteStatus } from "../IAgingCache";
import { AgingCacheWriteStrategy } from "./AgingCacheWriteStrategy";

/**
 * Strategy to overwrite regardless of the higher level value
 */
export class OverwriteAlwaysDeleteStrategy<TKey, TValue>
  extends AgingCacheWriteStrategy<TKey, TValue>
  implements IAgingCacheDeleteStrategy<TKey> {
  delete(key: TKey, force: boolean): Promise<AgingCacheWriteStatus> {
    return this.executeDelete(key);
  }

  evict(key: TKey, evictAtLevel?: number): Promise<AgingCacheWriteStatus> {
    return this.executeDelete(key, evictAtLevel);
  }
}
