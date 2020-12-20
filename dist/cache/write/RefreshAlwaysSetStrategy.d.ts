import { IAgingCacheSetStrategy } from "./IAgingCacheWriteStrategy";
import { AgingCacheWriteStatus } from "../IAgingCache";
import { AgingCacheWriteStrategy } from "./AgingCacheWriteStrategy";
/**
 * Strategy to overwrite only if we're forced to
 */
export declare class RefreshAlwaysSetStrategy<TKey, TValue> extends AgingCacheWriteStrategy<TKey, TValue> implements IAgingCacheSetStrategy<TKey, TValue> {
    set(key: TKey, value: TValue, force: boolean): Promise<AgingCacheWriteStatus>;
}
//# sourceMappingURL=RefreshAlwaysSetStrategy.d.ts.map