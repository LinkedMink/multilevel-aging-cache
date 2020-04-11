import { AgingCacheWriteStatus } from "../IAgingCache";
/**
 * Implements customized cache set behavior based on the IAgingCacheOptions
 */
export interface IAgingCacheSetStrategy<TKey, TValue> {
    /**
     * @param key The key to set
     * @param value The value to set
     * @param force If true write to all levels of hierarchy unconditionally
     * @returns If the write succeeded or the error condition
     */
    set(key: TKey, value: TValue, force: boolean): Promise<AgingCacheWriteStatus>;
}
/**
 * Implements customized cache delete behavior based on the IAgingCacheOptions
 */
export interface IAgingCacheDeleteStrategy<TKey> {
    /**
     * @param key The key to the value to delete
     * @param force If true write to all levels of hierarchy unconditionally
     * @returns If the write succeeded or the error condition
     */
    delete(key: TKey, force: boolean): Promise<AgingCacheWriteStatus>;
}
//# sourceMappingURL=IAgingCacheWriteStrategy.d.ts.map