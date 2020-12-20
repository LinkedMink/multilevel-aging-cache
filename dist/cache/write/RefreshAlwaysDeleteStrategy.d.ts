import { IAgingCacheDeleteStrategy } from "./IAgingCacheWriteStrategy";
import { AgingCacheWriteStatus } from "../IAgingCache";
import { AgingCacheWriteStrategy } from "./AgingCacheWriteStrategy";
/**
 * Strategy to overwrite only if we're forced to
 */
export declare class RefreshAlwaysDeleteStrategy<TKey, TValue> extends AgingCacheWriteStrategy<TKey, TValue> implements IAgingCacheDeleteStrategy<TKey> {
    delete(key: TKey, force: boolean): Promise<AgingCacheWriteStatus>;
}
//# sourceMappingURL=RefreshAlwaysDeleteStrategy.d.ts.map