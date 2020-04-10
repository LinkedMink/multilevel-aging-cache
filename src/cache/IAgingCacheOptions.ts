/**
 * The algorithm for selecting which element should be replaced first in a cache
 */
export enum AgingCacheReplacementPolicy {
  /**
   * Replace items in a First-in First-out manner
   */
  FIFO
}

/**
 * In a distributed environment, multiple instances could write to cache at once. This option 
 * determines what should happen if an exiting entry is found in a higher level cache.
 */
export enum AgingCacheWriteMode {
  /**
   * When a higher level cache has a key, refresh the lower level keys and only overwrite if 
   * the force option is supplied
   */
  RefreshAlways,
  /**
   * When our entry is newer, then allow it to take precedence and overwrite the higher level
   * caches. Refresh the lower level caches if older
   */
  OverwriteAged,
  /**
   * Unconditionally overwrite the value that's stored in higher level caches
   */
  OverwriteAlways
}

/**
 * The set of options used to construct an aging cache
 */
export interface IAgingCacheOptions {
  /**
   * The maximum number of entries to store in the cache, undefined for no max
   * FIFO: Check the lowest level for maximum
   */
  maxEntries?: number;
  /**
   * During a purge, the maximum value of the age marker to keep entries, varies by algorithm
   * FIFO: The maximum time to keep entries in minutes
   */
  ageLimit: number;
  /**
   * The interval to check for old entries in seconds
   */
  purgeInterval: number;
  /**
   * The order elements should be replaced when purging stale entries
   */
  replacementPolicy: AgingCacheReplacementPolicy;
  /**
   * Determine when a value should be overwritten in the storage hierarchy on set
   */
  setMode: AgingCacheWriteMode;
  /**
   * Determine when a value should be overwritten in the storage hierarchy on delete
   */
  deleteMode: AgingCacheWriteMode;
}

/**
 * @return Options for a default FIFO cache
 */
export function getDefaultAgingCacheOptions(): IAgingCacheOptions {
  return {
    maxEntries: undefined,
    ageLimit: 200,
    purgeInterval: 60,
    replacementPolicy: AgingCacheReplacementPolicy.FIFO,
    setMode: AgingCacheWriteMode.OverwriteAged,
    deleteMode: AgingCacheWriteMode.OverwriteAged,
  }
}
