import { IAgedValue } from "../cache/expire/IAgedQueue";

/**
 * Describes the layers written to in a set/delete operation
 */
export interface IStorageHierarchyWrite<TValue = unknown> {
  isPersisted: boolean;
  isPublished: boolean;
  writtenLevels: number;
  writtenValue?: IAgedValue<TValue>;
}

/**
 * When an update arrives from a higher level cache, how should we update lower level caches?
 */
export enum StorageHierarchyUpdatePolicy {
  /**
   * Only update lower level storage if the key currently resides in them. The next get on the key
   * will be forced to retrieve from the higher level, so this maintains consistency while not requiring
   * extra storage (at the cost of performance).
   */
  OnlyIfKeyExist,
  /**
   * Set the key/value in our lower level storage unconditionally. This might be important for permenant
   * storage hierarchies or higher read performance (at the cost of write performance and space).
   */
  Always,
}

/**
 * Represent a key/value multilevel storage hierarchy where read/writes are propogated up/down the hierarchy.
 * Typically, this is used in a system where different levels of the hierarchy have varying performance
 * characteristics (such as a memory system siting below a database).
 */
export interface IStorageHierarchy<TKey, TValue> {
  /**
   * @returns Number of storage layers
   */
  readonly totalLevels: number;
  /**
   * @returns If this storage hierarchy can be used for permenant storage
   */
  readonly isPersistable: boolean;

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
  setAtLevel(
    key: TKey,
    value: IAgedValue<TValue>,
    level?: number,
    isAscending?: boolean
  ): Promise<IStorageHierarchyWrite<TValue>>;

  /**
   * @param key The key to delete
   * @param level The level at which to delete the key
   * @param isAscending To go up the hierarchy (true) or down (false) from level
   * @returns If the write succeeded to all levels going up/down or the error condition
   */
  deleteAtLevel(
    key: TKey,
    level?: number,
    isAscending?: boolean
  ): Promise<IStorageHierarchyWrite<TValue>>;

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
  setBelowTopLevel(key: TKey, value: IAgedValue<TValue>): Promise<IStorageHierarchyWrite<TValue>>;
}
