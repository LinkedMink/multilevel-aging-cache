/**
 * Describes what happened during a write to an aging cache
 */
export enum AgingCacheWriteStatus {
  /**
   * All caches were written successfully
   */
  Success,
  /**
   * Lower level caches were updated from a newer value in a higher level cache
   */
  Refreshed,
  /**
   * A higher level cache had a value update, but a write failed to a lower level cache
   */
  RefreshedError,
  /**
   * Higher level caches were updated, but a lower level cache failed
   */
  PartialWrite,
  /**
   * An error occured while writing
   */
  UnspecifiedError,
}

/**
 * Represents a cache the has a replacement policy. Note that age is not necessarily
 * tied to time.
 */
export interface IAgingCache<TKey, TValue> {
  /**
   * @param key The key to retrieve
   * @param force If true force read from the top level instead of lower levels first
   * @returns The value if it's in the cache or null
   */
  get(key: TKey, force?: boolean): Promise<TValue | null>;

  /**
   * @param key The key to set
   * @param value The value to set
   * @param force If true write to all levels of hierarchy unconditionally
   * @returns If the write succeeded or the error condition
   */
  set(
    key: TKey,
    value: TValue,
    force?: boolean
  ): Promise<AgingCacheWriteStatus>;

  /**
   * @param key The key to the value to delete
   * @param force If true write to all levels of hierarchy unconditionally
   * @returns If the write succeeded or the error condition
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
  purge(): Promise<void>;
}
