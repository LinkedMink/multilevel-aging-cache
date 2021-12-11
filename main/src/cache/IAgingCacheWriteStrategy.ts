import { IAgingCacheWrite } from './IAgingCache';

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
  set(key: TKey, value: TValue, force: boolean): Promise<IAgingCacheWrite<TValue>>;

  /**
   * @param key The key to the value to set
   * @param value The value to set
   * @param evictAtLevel The level to set below
   * @param force If true write to levels below the persistence layer
   * @returns If the write succeeded or the error condition
   */
  load(
    key: TKey,
    value: TValue,
    evictAtLevel?: number,
    force?: boolean
  ): Promise<IAgingCacheWrite<TValue>>;
}

/**
 * Implements customized cache delete behavior based on the IAgingCacheOptions
 */
export interface IAgingCacheDeleteStrategy<TKey, TValue> {
  /**
   * @param key The key to the value to delete
   * @param force If true write to all levels of hierarchy unconditionally
   * @returns If the write succeeded or the error condition
   */
  delete(key: TKey, force: boolean): Promise<IAgingCacheWrite<TValue>>;

  /**
   * @param key The key to the value to delete
   * @param evictAtLevel The level to delete below
   * @param force If true write to levels below the persistence layer
   * @returns If the write succeeded or the error condition
   */
  evict(key: TKey, evictAtLevel?: number, force?: boolean): Promise<IAgingCacheWrite<TValue>>;
}
