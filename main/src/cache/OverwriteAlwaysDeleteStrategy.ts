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
  delete(key: TKey, _force: boolean): Promise<IAgingCacheWrite<TValue>> {
    return this.executeDelete(key);
  }

  evict(key: TKey, evictAtLevel?: number, _force?: boolean): Promise<IAgingCacheWrite<TValue>> {
    return this.executeDelete(key, evictAtLevel);
  }
}
