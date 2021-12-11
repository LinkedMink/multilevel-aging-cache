import { RefreshAlwaysSetStrategy } from '../../../src/cache/write/RefreshAlwaysSetStrategy';
import { StorageHierarchy } from '../../../src/storage/StorageHierarchy';
import { MockStorageHierarchy, MockAgedQueue } from '../../Mocks';
import { AgingCacheWriteStatus } from '../../../src/cache/IAgingCache';
import { setGlobalMockTransport } from '../../MockTransport';

describe(RefreshAlwaysSetStrategy.name, () => {
  let hierarchyMock: StorageHierarchy<string, string>;
  let evictQueueMock: MockAgedQueue<string>;
  let strategy: RefreshAlwaysSetStrategy<string, string>;

  beforeAll(() => {
    setGlobalMockTransport();
  });

  beforeEach(() => {
    hierarchyMock = new MockStorageHierarchy() as unknown as StorageHierarchy<string, string>;
    evictQueueMock = new MockAgedQueue<string>();
    strategy = new RefreshAlwaysSetStrategy(hierarchyMock, evictQueueMock);
  });

  test('should return instance when constructor parameters are valid', () => {
    expect(strategy).toBeDefined();
  });

  test('should execute set unconditionally when set() is called with force', () => {
    const testKey = 'TEST_KEY';
    const testValue = 'TEST_VALUE';
    const testAge = 1000000;
    evictQueueMock.getInitialAge = jest.fn().mockReturnValue(testAge);
    hierarchyMock.getValueAtTopLevel = jest
      .fn()
      .mockResolvedValue({ age: testAge + 20, value: testValue });

    const promise = strategy.set(testKey, testValue, true);

    return promise.then(status => {
      expect(status).toEqual(AgingCacheWriteStatus.Success);
      expect(hierarchyMock.setAtLevel).toBeCalledWith(testKey, {
        value: testValue,
        age: testAge,
      });
    });
  });

  test("should execute set when set() is called and highest level doesn't have key", () => {
    const testKey = 'TEST_KEY';
    const testValue = 'TEST_VALUE';
    const testAge = 1000000;
    evictQueueMock.getInitialAge = jest.fn().mockReturnValue(testAge);
    hierarchyMock.getValueAtTopLevel = jest.fn().mockResolvedValue(null);

    const promise = strategy.set(testKey, testValue, false);

    return promise.then(status => {
      expect(status).toEqual(AgingCacheWriteStatus.Success);
      expect(hierarchyMock.setAtLevel).toBeCalledWith(testKey, {
        value: testValue,
        age: testAge,
      });
    });
  });

  test('should execute set when set() is called and highest level has key with same age', () => {
    const testKey = 'TEST_KEY';
    const testValue = 'TEST_VALUE';
    const testAge = 1000000;
    evictQueueMock.getInitialAge = jest.fn().mockReturnValue(testAge);
    const testHighLevelValue = { age: testAge - 20, value: testValue };
    hierarchyMock.getValueAtTopLevel = jest.fn().mockResolvedValue(testHighLevelValue);
    hierarchyMock.getValueAtBottomLevel = jest.fn().mockResolvedValue(testHighLevelValue);

    const promise = strategy.set(testKey, testValue, false);

    return promise.then(status => {
      expect(status).toEqual(AgingCacheWriteStatus.Success);
      expect(hierarchyMock.setAtLevel).toBeCalledWith(testKey, {
        value: testValue,
        age: testAge,
      });
    });
  });

  test('should not execute set when set() is called and highest level has key', () => {
    const testKey = 'TEST_KEY';
    const testValue = 'TEST_VALUE';
    const testAge = 1000000;
    evictQueueMock.getInitialAge = jest.fn().mockReturnValue(testAge);
    const testHighLevelValue = { age: testAge - 20, value: testValue };
    hierarchyMock.getValueAtTopLevel = jest.fn().mockResolvedValue(testHighLevelValue);

    const promise = strategy.set(testKey, testValue, false);

    return promise.then(status => {
      expect(status).toEqual(AgingCacheWriteStatus.Refreshed);
      expect(hierarchyMock.setAtLevel).not.toBeCalledWith(testKey, {
        value: testValue,
        age: testAge,
      });
      expect(hierarchyMock.setBelowTopLevel).toBeCalledWith(testKey, testHighLevelValue);
    });
  });
});
