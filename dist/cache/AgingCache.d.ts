import { IDisposable } from "../shared/IDisposable";
import { IAgingCache, AgingCacheWriteStatus } from "./IAgingCache";
import { IAgedQueue } from "./expire/IAgedQueue";
import { IStorageHierarchy } from "../storage/IStorageHierarchy";
import { IAgingCacheDeleteStrategy, IAgingCacheSetStrategy } from "./write/IAgingCacheWriteStrategy";
/**
 * A cache that will replace entries in the order specified by the input IAgedQueue
 */
export declare class AgingCache<TKey, TValue> implements IAgingCache<TKey, TValue>, IDisposable {
    private readonly hierarchy;
    private readonly evictQueue;
    private readonly setStrategy;
    private readonly deleteStrategy;
    private static readonly logger;
    private readonly purgeInterval;
    private purgeTimer?;
    private purgePromise?;
    /**
     * @param hierarchy The storage hierarchy to operate on
     * @param evictQueue The keys in the order to evict
     * @param setStrategy The implementation for setting keys
     * @param deleteStrategy The implementation for deleting keys
     * @param purgeInterval The interval to check for old entries in seconds
     */
    constructor(hierarchy: IStorageHierarchy<TKey, TValue>, evictQueue: IAgedQueue<TKey>, setStrategy: IAgingCacheSetStrategy<TKey, TValue>, deleteStrategy: IAgingCacheDeleteStrategy<TKey>, purgeInterval?: number);
    /**
     * Clean up the object when it's no longer used. After a dispose(), an object
     * is no longer guaranteed to be usable.
     */
    dispose(): Promise<void> | void;
    /**
     * @param key The key to retrieve
     * @returns The value if it's in the cache or undefined
     */
    get(key: TKey, force?: boolean): Promise<TValue | null>;
    /**
     * @param key The key to set
     * @param value The value to set
     * @returns If setting the value was successful
     */
    set(key: TKey, value: TValue, force?: boolean): Promise<AgingCacheWriteStatus>;
    /**
     * @param key The key to the value to delete
     * @returns If deleting the value was successful
     */
    delete(key: TKey, force?: boolean): Promise<AgingCacheWriteStatus>;
    /**
     * @returns The keys that are currently in the cache
     */
    keys(): Promise<TKey[]>;
    /**
     * Purge the cache of stale entries instead of waiting for a periodic check
     * @return A promise to track when the purge finishes
     */
    purge: () => Promise<void>;
    private purgeNext;
    private evict;
}
//# sourceMappingURL=AgingCache.d.ts.map