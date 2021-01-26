import path from "path";
import { IAgingCache } from "./IAgingCache";
import {
  getDefaultAgingCacheOptions,
  AgingCacheWriteMode,
  IAgingCacheOptions,
  AgingCacheReplacementPolicy,
} from "./IAgingCacheOptions";
import { RefreshAlwaysSetStrategy } from "./write/RefreshAlwaysSetStrategy";
import { OverwriteAlwaysSetStrategy } from "./write/OverwriteAlwaysSetStrategy";
import { OverwriteAgedSetStrategy } from "./write/OverwriteAgedSetStrategy";
import { RefreshAlwaysDeleteStrategy } from "./write/RefreshAlwaysDeleteStrategy";
import { OverwriteAlwaysDeleteStrategy } from "./write/OverwriteAlwaysDeleteStrategy";
import { OverwriteAgedDeleteStrategy } from "./write/OverwriteAgedDeleteStrategy";
import { Logger } from "../shared/Logger";
import { AgingCache } from "./AgingCache";
import { IStorageHierarchy } from "../storage/IStorageHierarchy";
import { IAgedQueue } from "./expire/IAgedQueue";
import { FIFOAgedQueue } from "./expire/FIFOAgedQueue";
import {
  IAgingCacheSetStrategy,
  IAgingCacheDeleteStrategy,
} from "./write/IAgingCacheWriteStrategy";

type IAgedQueueConstructor = new <TKey>(
  maxEntries?: number,
  ageLimit?: number
) => IAgedQueue<TKey>;
type IAgingCacheSetStrategyConstructor = new <TKey, TValue>(
  hierarchy: IStorageHierarchy<TKey, TValue>,
  evictQueue: IAgedQueue<TKey>
) => IAgingCacheSetStrategy<TKey, TValue>;
type IAgingCacheDeleteStrategyConstructor = new <TKey, TValue>(
  hierarchy: IStorageHierarchy<TKey, TValue>,
  evictQueue: IAgedQueue<TKey>
) => IAgingCacheDeleteStrategy<TKey>;

const agedQueueMap = new Map<
  AgingCacheReplacementPolicy,
  IAgedQueueConstructor
>([[AgingCacheReplacementPolicy.FIFO, FIFOAgedQueue]]);

const setStrategyMap = new Map<
  AgingCacheWriteMode,
  IAgingCacheSetStrategyConstructor
>([
  [AgingCacheWriteMode.RefreshAlways, RefreshAlwaysSetStrategy],
  [AgingCacheWriteMode.OverwriteAlways, OverwriteAlwaysSetStrategy],
  [AgingCacheWriteMode.OverwriteAged, OverwriteAgedSetStrategy],
]);

const deleteStrategyMap = new Map<
  AgingCacheWriteMode,
  IAgingCacheDeleteStrategyConstructor
>([
  [AgingCacheWriteMode.RefreshAlways, RefreshAlwaysDeleteStrategy],
  [AgingCacheWriteMode.OverwriteAlways, OverwriteAlwaysDeleteStrategy],
  [AgingCacheWriteMode.OverwriteAged, OverwriteAgedDeleteStrategy],
]);

export function checkAgingCacheOptionsValid(
  options: IAgingCacheOptions
): Error | undefined {
  if (options.maxEntries !== undefined && options.maxEntries < 1) {
    return Error(`maxEntries(${options.maxEntries}): must be greater than 0`);
  }

  if (
    options.replacementPolicy === AgingCacheReplacementPolicy.FIFO &&
    options.ageLimit * 60 <= options.purgeInterval
  ) {
    return Error(
      `maxAge(${options.ageLimit} min): must be greater than purgeInterval(${options.purgeInterval} sec)`
    );
  }

  if (options.purgeInterval < 10) {
    return Error(
      `purgeInterval(${options.purgeInterval}): must be greater than 10 seconds`
    );
  }
}

/**
 * Create a new instance of IAgingCache. This function is a factory that will construct the
 * corrent implementation based on the provided options.
 * @param hierarchy The storage hierarchy with the level index 0 being the lowest level
 * @param options Options for the behavior of the cache, if undefined use getDefaultAgingCacheOptions
 */
export function createAgingCache<TKey, TValue>(
  hierarchy: IStorageHierarchy<TKey, TValue>,
  options?: IAgingCacheOptions
): IAgingCache<TKey, TValue> {
  if (!options) {
    options = getDefaultAgingCacheOptions();
  } else {
    const validationError = checkAgingCacheOptionsValid(options);
    if (validationError) {
      const logger = Logger.get(path.basename(__filename));
      logger.error(validationError.message);
      throw validationError;
    }
  }

  const agedQueueConstructor = agedQueueMap.get(options.replacementPolicy);
  if (!agedQueueConstructor) {
    throw new Error(
      `Unsupported replacementPolicy: ${options.replacementPolicy}`
    );
  }

  const setStrategyConstructor = setStrategyMap.get(options.setMode);
  if (!setStrategyConstructor) {
    throw new Error(`Unsupported setMode: ${options.setMode}`);
  }

  const deleteStrategyConstructor = deleteStrategyMap.get(options.deleteMode);
  if (!deleteStrategyConstructor) {
    throw new Error(`Unsupported deleteMode: ${options.deleteMode}`);
  }

  const evictQueue = new agedQueueConstructor<TKey>(
    options.maxEntries,
    options.ageLimit
  );
  const setStrategy = new setStrategyConstructor(hierarchy, evictQueue);
  const deleteStrategy = new deleteStrategyConstructor(hierarchy, evictQueue);
  return new AgingCache<TKey, TValue>(
    hierarchy,
    evictQueue,
    setStrategy,
    deleteStrategy,
    options.purgeInterval
  );
}
