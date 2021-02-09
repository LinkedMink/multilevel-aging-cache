export { IAgedValue, IAgedQueue } from "./expire/IAgedQueue";
export { IAgingCache, AgingCacheWriteStatus } from "./IAgingCache";
export { createAgingCache } from "./IAgingCacheFactory";
export {
  IAgingCacheOptions,
  getDefaultAgingCacheOptions,
  AgingCacheReplacementPolicy,
  AgingCacheWriteMode,
} from "./IAgingCacheOptions";
