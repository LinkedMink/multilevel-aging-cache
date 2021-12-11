import { IAgingCacheDeleteStrategy } from './IAgingCacheWriteStrategy';
import { IAgingCacheWrite } from './IAgingCache';
import { AgingCacheWriteStrategy } from './AgingCacheWriteStrategy';

/**
 * Strategy to overwrite regardless of the higher level value
 */
export class OverwriteAlwaysDeleteStrategy<TKey, TValue>
  extends AgingCacheWriteStrategy<TKey, TValue>
  implements IAgingCacheDeleteStrategy<TKey, TValue>
{
  delete(key: TKey, force: boolean): Promise<IAgingCacheWrite<TValue>> {
    return this.executeDelete(key);
  }

  evict(key: TKey, evictAtLevel?: number, force?: boolean): Promise<IAgingCacheWrite<TValue>> {
    return this.executeDelete(key, evictAtLevel);
  }
}
