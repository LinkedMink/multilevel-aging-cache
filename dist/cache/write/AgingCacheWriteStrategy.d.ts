import { IAgedValue, IAgedQueue } from "../expire/IAgedQueue";
import { AgingCacheWriteStatus } from "../IAgingCache";
import { IStorageHierarchy } from "../../storage/IStorageHierarchy";
/**
 * Keep common methods and data for each set/delete strategy here
 */
export declare abstract class AgingCacheWriteStrategy<TKey, TValue> {
    protected readonly hierarchy: IStorageHierarchy<TKey, TValue>;
    protected readonly evictQueue: IAgedQueue<TKey>;
    protected static readonly logger: import("winston").Logger;
    /**
     * @param hierarchy The storage hierarchy to operate on
     * @param evictQueue The keys in the order to evict
     */
    constructor(hierarchy: IStorageHierarchy<TKey, TValue>, evictQueue: IAgedQueue<TKey>);
    protected executeDelete: (key: TKey) => Promise<AgingCacheWriteStatus>;
    protected executeSet: (key: TKey, value: TValue) => Promise<AgingCacheWriteStatus>;
    protected setFromHighestLevel: (key: TKey, agedValue: IAgedValue<TValue>) => Promise<AgingCacheWriteStatus>;
}
//# sourceMappingURL=AgingCacheWriteStrategy.d.ts.map