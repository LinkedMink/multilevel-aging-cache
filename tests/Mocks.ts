import { IStorageProvider } from "../src/storage/IStorageProvider";
import { ISerializer } from "../src/serialization/ISerializer";
import { IAgingCacheSetStrategy, IAgingCacheDeleteStrategy } from "../src/cache/write/IAgingCacheWriteStrategy";
import { AgingCacheWriteStatus } from "../src/cache/IAgingCache";
import { IStorageHierarchy } from "../src/storage/IStorageHierarchy";
import { IAgedQueue } from "../src/cache/expire/IAgedQueue";

export class MockSerializer implements ISerializer<string> {
  static testSerializePrefix = "TEST12345_";
  serialize = jest.fn((data: string) => MockSerializer.testSerializePrefix + data);
  deserialize = jest.fn((data: string) => data.substring(MockSerializer.testSerializePrefix.length));
}

export class MockStorageProvider<TKey, TValue> implements IStorageProvider<TKey, TValue> {
  get = jest.fn().mockResolvedValue(null);
  set = jest.fn().mockResolvedValue(true);
  delete = jest.fn().mockResolvedValue(true);
  keys = jest.fn().mockResolvedValue([]);
  size = jest.fn().mockResolvedValue(0);
  subscribe = jest.fn().mockReturnValue(true);
  unsubscribe = jest.fn().mockReturnValue(true);
}

export class MockStorageHierarchy<TKey, TValue> implements IStorageHierarchy<TKey, TValue> {
  getAtLevel = jest.fn().mockResolvedValue(null);
  setAtLevel = jest.fn().mockResolvedValue(AgingCacheWriteStatus.Success);
  deleteAtLevel = jest.fn().mockResolvedValue(AgingCacheWriteStatus.Success);
  getSizeAtLevel = jest.fn().mockResolvedValue(0);
  getKeysAtTopLevel = jest.fn().mockResolvedValue([]);
  getValueAtTopLevel = jest.fn().mockResolvedValue(null);
  getValueAtBottomLevel = jest.fn().mockResolvedValue(null);
  setBelowTopLevel = jest.fn().mockResolvedValue(AgingCacheWriteStatus.Success);
}

export class MockAgingCacheSetStrategy<TKey, TValue> implements IAgingCacheSetStrategy<TKey, TValue> {
  set = jest.fn().mockResolvedValue(AgingCacheWriteStatus.Success);
}

export class MockAgingCacheDeleteStrategy<TKey> implements IAgingCacheDeleteStrategy<TKey> {
  delete = jest.fn().mockResolvedValue(AgingCacheWriteStatus.Success);
}

export class MockAgedQueue<TKey> implements IAgedQueue<TKey> {
  addOrReplace = jest.fn();
  next = jest.fn().mockReturnValue(null);
  delete = jest.fn();
  isNextExpired = jest.fn().mockReturnValue(false);
  getInitialAge = jest.fn().mockReturnValue(0);
  updateAge = jest.fn();
  compare = jest.fn((a, b) => a - b);
  size = jest.fn().mockReturnValue(0);
}