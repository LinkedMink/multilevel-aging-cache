import { IAgingCacheDeleteStrategy } from "./IAgingCacheWriteStrategy";
import { AgingCacheWriteStatus } from "../IAgingCache";
import { AgingCacheWriteStrategy } from "./AgingCacheWriteStrategy";
/**
 * Strategy to overwrite only if our value is newer than the high level
 */
export declare class OverwriteAgedDeleteStrategy<TKey, TValue> extends AgingCacheWriteStrategy<TKey, TValue> implements IAgingCacheDeleteStrategy<TKey> {
    delete(key: TKey, force: boolean): Promise<AgingCacheWriteStatus>;
}
//# sourceMappingURL=OverwriteAgedDeleteStrategy.d.ts.map