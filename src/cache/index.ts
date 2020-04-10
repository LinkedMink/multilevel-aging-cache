import { IAgingCache, AgingCacheWriteStatus } from "./IAgingCache"
import { createAgingCache } from "./IAgingCacheFactory"
import { 
  IAgingCacheOptions, 
  getDefaultAgingCacheOptions, 
  AgingCacheReplacementPolicy, 
  AgingCacheWriteMode 
} from "./IAgingCacheOptions"

export {
  IAgingCache,
  AgingCacheWriteStatus,
  createAgingCache,
  IAgingCacheOptions,
  getDefaultAgingCacheOptions,
  AgingCacheReplacementPolicy,
  AgingCacheWriteMode,
}
