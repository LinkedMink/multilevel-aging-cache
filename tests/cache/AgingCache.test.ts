import { AgingCache } from "../../src/cache/AgingCache";
import { StorageHierarchy } from "../../src/storage/StorageHierarchy";
import { AgingCacheWriteStatus } from "../../src/cache/IAgingCache";
import { MockAgingCacheSetStrategy, MockAgingCacheDeleteStrategy, MockStorageHierarchy, MockAgedQueue } from "../Mocks";

describe("AgingCache.ts", () => {
  jest.useFakeTimers();

  let hierarchyMock: StorageHierarchy<string, string>;
  let setStrategyMock: MockAgingCacheSetStrategy<string, string>;
  let deleteStrategyMock: MockAgingCacheDeleteStrategy<string>;
  let evictQueueMock: MockAgedQueue<string>;
  let cache: AgingCache<string, string>;

  beforeEach(() => {
    hierarchyMock = new MockStorageHierarchy() as unknown as StorageHierarchy<string, string>
    setStrategyMock = new MockAgingCacheSetStrategy();
    deleteStrategyMock = new MockAgingCacheDeleteStrategy();
    evictQueueMock = new MockAgedQueue<string>();
    cache = new AgingCache(hierarchyMock, evictQueueMock, setStrategyMock, deleteStrategyMock);
  })

  // TODO investigate open handles on purge
  afterEach(done => {
    const disposePromise = cache ? cache.dispose() : undefined;
    if (!disposePromise) {
      done();
      return;
    }

    disposePromise.then(() => {
      done();
    });
  })

  test("should get unwrapped value from hierarchy when get() is called", () => {
    const testKey = "TEST_KEY";
    const testValue = { value: "TEST_VALUE", age: 0 };
    hierarchyMock.getAtLevel = jest.fn().mockResolvedValue(testValue);
    
    const promise = cache.get(testKey);

    return promise.then(value => {
      expect(value).toEqual(testValue.value);
    })
  });

  test("should return null when hierachy value is null when get() is called", () => {
    const testKey = "TEST_KEY";
    hierarchyMock.getAtLevel = jest.fn().mockResolvedValue(null);

    const promise = cache.get(testKey);

    return promise.then(value => {
      expect(value).toBeNull();
    })
  });

  test("should use specific set strategy when set() is called", () => {
    const testKey = "TEST_KEY";
    const testValue = "TEST_VALUE";
    setStrategyMock.set = jest.fn().mockResolvedValue(true);

    const promise = cache.set(testKey, testValue);

    return promise.then(value => {
      expect(value).toEqual(true);
      expect(setStrategyMock.set).toHaveBeenCalledWith(testKey, testValue, false)
    })
  });

  test("should check for expired entries and evict when set() is called", () => {
    const testKey = "TEST_KEY";
    const testValue = "TEST_VALUE";
    setStrategyMock.set = jest.fn().mockResolvedValue(true);
    evictQueueMock.isNextExpired = jest.fn().mockResolvedValue(true);
    cache = new AgingCache(hierarchyMock, evictQueueMock, setStrategyMock, deleteStrategyMock);
    const evictSpy = jest.spyOn(cache as any, "evict");

    const promise = cache.set(testKey, testValue);

    return promise.then(value => {
      expect(value).toEqual(true);
      expect(setStrategyMock.set).toHaveBeenCalledWith(testKey, testValue, false)
      expect(evictSpy).toHaveBeenCalled();
    })
  });

  test("should use specific delete strategy when delete() is called", () => {
    const testKey = "TEST_KEY";
    deleteStrategyMock.delete = jest.fn().mockResolvedValue(true);

    const promise = cache.delete(testKey);

    return promise.then(value => {
      expect(value).toEqual(true);
      expect(deleteStrategyMock.delete).toHaveBeenCalledWith(testKey, false)
    })
  });

  test("should get top level keys in hierarchy when keys() is called", () => {
    const testKeys = [ "TEST_KEY1", "TEST_KEY2", "TEST_KEY3", "TEST_KEY4" ];
    hierarchyMock.getKeysAtTopLevel = jest.fn().mockResolvedValue(testKeys);

    const promise = cache.keys();

    return promise.then(keys => {
      expect(hierarchyMock.getKeysAtTopLevel).toHaveBeenCalled();
      expect(keys.length).toEqual(testKeys.length);
      keys.forEach(key => expect(testKeys.includes(key)).toEqual(true));
    })
  });

  test("should stop purging stale entries when disposed", () => {
    const purgeInterval = 10;
    const testPurgeIntervalMilliseconds = purgeInterval * 1000;
    cache = new AgingCache(hierarchyMock, evictQueueMock, setStrategyMock, deleteStrategyMock, purgeInterval);
    const purgeSpy = jest.spyOn(cache as any, "purgeNext");

    cache.dispose();
    jest.advanceTimersByTime(testPurgeIntervalMilliseconds);

    expect(purgeSpy).not.toHaveBeenCalled();
  })

  test("should purge stale entries on a periodic interval when active", () => {
    const purgeInterval = 10;
    const testPurgeIntervalMilliseconds = purgeInterval * 1000;
    cache = new AgingCache(hierarchyMock, evictQueueMock, setStrategyMock, deleteStrategyMock, purgeInterval);
    const purgeSpy = jest.spyOn(cache as any, "purgeNext");

    jest.advanceTimersByTime(testPurgeIntervalMilliseconds);

    expect(purgeSpy).toHaveBeenCalled();
  })

  test("should evict keys until isNextExpired() is false when purging stale entries", () => {
    const maxAgeMinutes = 1;
    const maxAgeMilliseconds = maxAgeMinutes * 60 * 1000
    const testDate = 1000000;
    jest.spyOn(Date, 'now').mockReturnValue(testDate);
    const queueMock = [
      { age: testDate - maxAgeMilliseconds - 50, key: "TEST_KEY1" },
      { age: testDate - maxAgeMilliseconds- 30, key: "TEST_KEY2" },
      { age: testDate - maxAgeMilliseconds - 10, key: "TEST_KEY3" },
      { age: testDate - maxAgeMilliseconds + 5, key: "TEST_KEY4" },
      { age: testDate - maxAgeMilliseconds + 35, key: "TEST_KEY5" },
    ];
    let queueMockIndex = 0;
    evictQueueMock.next = jest.fn(() => queueMock[queueMockIndex].key);
    evictQueueMock.isNextExpired = jest.fn(() => queueMockIndex <= 2);
    deleteStrategyMock.delete = jest.fn(key => {
      queueMockIndex++;
      return Promise.resolve(AgingCacheWriteStatus.Success);
    });
    cache = new AgingCache(hierarchyMock, evictQueueMock, setStrategyMock, deleteStrategyMock, 1000);

    return cache.purge().then(() => {
      expect(deleteStrategyMock.delete).toHaveBeenCalledTimes(3);
      expect(deleteStrategyMock.delete).toHaveBeenCalledWith(queueMock[0].key, false);
      expect(deleteStrategyMock.delete).toHaveBeenCalledWith(queueMock[1].key, false);
      expect(deleteStrategyMock.delete).toHaveBeenCalledWith(queueMock[2].key, false);
    })
  })
});
