import { IStorageProvider } from "./IStorageProvider";
import { IAgedValue } from "../cache/expire/IAgedQueue";
import { AgingCacheWriteStatus } from "../cache/IAgingCache";
import { IDisposable } from "../shared/IDisposable";
import { IStorageHierarchy, StorageHierarchyUpdatePolicy } from "./IStorageHierarchy";
/**
 * The default storage hierarchy implementation relying on IStorageProvider for actual data access
 */
export declare class StorageHierarchy<TKey, TValue> implements IStorageHierarchy<TKey, TValue>, IDisposable {
    private readonly levels;
    private readonly updatePolicy;
    private static readonly logger;
    private readonly storageChangedHandlers;
    private readonly pendingUpdates;
    /**
     * @param levels The levels in the hierarchy with index 0 being the lowest level (first to read)
     * @param updatePolicy How updates from subscribed higher level storage providers should be handled
     */
    constructor(levels: IStorageProvider<TKey, TValue>[], updatePolicy?: StorageHierarchyUpdatePolicy);
    /**
     * Clean up the object when it's no longer used. After a dispose(), an object
     * is no longer guaranteed to be usable.
     */
    dispose(): Promise<void>;
    /**
     * @param key The key to retrieve
     * @param level The level at which to retrieve the key
     * @param isAscending To go up the hierarchy (true) or down (false) from level
     * @returns The value if it's in the hierarchy from the level going up/down or null
     */
    getAtLevel(key: TKey, level?: number, isAscending?: boolean): Promise<IAgedValue<TValue> | null>;
    /**
     * @param key The key to set
     * @param value The value to set
     * @param level The level at which to set the key
     * @param isAscending To go up the hierarchy (true) or down (false) from level
     * @returns If the write succeeded to all levels going up/down or the error condition
     */
    setAtLevel(key: TKey, value: IAgedValue<TValue>, level?: number, isAscending?: boolean): Promise<AgingCacheWriteStatus>;
    /**
     * @param key The key to delete
     * @param level The level at which to delete the key
     * @param isAscending To go up the hierarchy (true) or down (false) from level
     * @returns If the write succeeded to all levels going up/down or the error condition
     */
    deleteAtLevel(key: TKey, level?: number, isAscending?: boolean): Promise<AgingCacheWriteStatus>;
    /**
     * @param level The level at which to search
     * @return The number of keys at the specified level
     */
    getSizeAtLevel(level: number): Promise<number>;
    /**
     * @returns The keys a the top level (should be all keys across the entire hierarchy)
     */
    getKeysAtTopLevel(): Promise<TKey[]>;
    /**
     * @param key The key to retrieve
     * @returns The value at the top level only or null
     */
    getValueAtTopLevel(key: TKey): Promise<IAgedValue<TValue> | null>;
    /**
     * @param key The key to retrieve
     * @returns The value at the bottom level only or null
     */
    getValueAtBottomLevel(key: TKey): Promise<IAgedValue<TValue> | null>;
    /**
     * Set only the levels below the top level (for refresing from the top level for instance)
     * @param key The key to set
     * @param value The value to set
     * @returns If the write succeeded to all levels going up/down or the error condition
     */
    setBelowTopLevel(key: TKey, value: IAgedValue<TValue>): Promise<AgingCacheWriteStatus>;
    private subscribeAtLevel;
    private getCurrentLevelOrNull;
    private getErrorByLevelAndDirection;
    private getUpdateHandlerAlways;
    private getUpdateHandlerOnlyIfKeyExist;
    private getManagedPromiseSubscribe;
}
//# sourceMappingURL=StorageHierarchy.d.ts.map