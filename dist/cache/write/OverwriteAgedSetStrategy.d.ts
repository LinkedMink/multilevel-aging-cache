import { IAgingCacheSetStrategy } from "./IAgingCacheWriteStrategy";
import { AgingCacheWriteStatus } from "../IAgingCache";
import { AgingCacheWriteStrategy } from "./AgingCacheWriteStrategy";
/**
 * Strategy to overwrite only if our value is newer than the high level
 */
export declare class OverwriteAgedSetStrategy<TKey, TValue> extends AgingCacheWriteStrategy<TKey, TValue> implements IAgingCacheSetStrategy<TKey, TValue> {
    set(key: TKey, value: TValue, force: boolean): Promise<AgingCacheWriteStatus>;
}
//# sourceMappingURL=OverwriteAgedSetStrategy.d.ts.map