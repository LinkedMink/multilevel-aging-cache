import { IAgingCache } from "./IAgingCache";
import { IAgingCacheOptions } from "./IAgingCacheOptions";
import { IStorageHierarchy } from "../storage/IStorageHierarchy";
export declare function checkAgingCacheOptionsValid(options: IAgingCacheOptions): Error | undefined;
/**
 * Create a new instance of IAgingCache. This function is a factory that will construct the
 * corrent implementation based on the provided options.
 * @param hierarchy The storage hierarchy with the level index 0 being the lowest level
 * @param options Options for the behavior of the cache, if undefined use getDefaultAgingCacheOptions
 */
export declare function createAgingCache<TKey, TValue>(hierarchy: IStorageHierarchy<TKey, TValue>, options?: IAgingCacheOptions): IAgingCache<TKey, TValue>;
//# sourceMappingURL=IAgingCacheFactory.d.ts.map