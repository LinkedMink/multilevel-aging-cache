import { RefreshAlwaysDeleteStrategy } from '../../../src/cache/write/RefreshAlwaysDeleteStrategy';
import { StorageHierarchy } from '../../../src/storage/StorageHierarchy';
import { MockStorageHierarchy, MockAgedQueue } from '../../Mocks';
import { AgingCacheWriteStatus } from '../../../src/cache/IAgingCache';
import { setGlobalMockTransport } from '../../MockTransport';

describe(RefreshAlwaysDeleteStrategy.name, () => {
  let hierarchyMock: StorageHierarchy<string, string>;
  let evictQueueMock: MockAgedQueue<string>;
  let strategy: RefreshAlwaysDeleteStrategy<string, string>;

  beforeAll(() => {
    setGlobalMockTransport();
  });

  beforeEach(() => {
    hierarchyMock = new MockStorageHierarchy() as unknown as StorageHierarchy<string, string>;
    evictQueueMock = new MockAgedQueue<string>();
    strategy = new RefreshAlwaysDeleteStrategy(hierarchyMock, evictQueueMock);
  });

  test('should return instance when constructor parameters are valid', () => {
    expect(strategy).toBeDefined();
  });

  test('should execute delete unconditionally when delete() is called with force', () => {
    const testKey = 'TEST_KEY';
    const testAge = 1000000;
    hierarchyMock.getValueAtTopLevel = jest
      .fn()
      .mockResolvedValue({ age: testAge + 20, value: 'TEST_VALUE' });

    const promise = strategy.delete(testKey, true);

    return promise.then(status => {
      expect(status).toEqual(AgingCacheWriteStatus.Success);
      expect(hierarchyMock.deleteAtLevel).toBeCalledWith(testKey);
    });
  });

  test("should execute delete when delete() is called and highest level doesn't have key", () => {
    const testKey = 'TEST_KEY';
    hierarchyMock.getValueAtTopLevel = jest.fn().mockResolvedValue(null);

    const promise = strategy.delete(testKey, false);

    return promise.then(status => {
      expect(status).toEqual(AgingCacheWriteStatus.Success);
      expect(hierarchyMock.deleteAtLevel).toBeCalledWith(testKey);
    });
  });

  test('should not execute delete when delete() is called and highest level has key with same age', () => {
    const testKey = 'TEST_KEY';
    const testAge = 1000000;
    const testHighLevelValue = { age: testAge - 20, value: 'TEST_VALUE' };
    hierarchyMock.getValueAtTopLevel = jest.fn().mockResolvedValue(testHighLevelValue);
    hierarchyMock.getValueAtBottomLevel = jest.fn().mockResolvedValue(testHighLevelValue);

    const promise = strategy.delete(testKey, false);

    return promise.then(status => {
      expect(status).toEqual(AgingCacheWriteStatus.Success);
      expect(hierarchyMock.deleteAtLevel).toBeCalledWith(testKey);
    });
  });

  test('should not execute delete when delete() is called and highest level has key', () => {
    const testKey = 'TEST_KEY';
    const testAge = 1000000;
    const testHighLevelValue = { age: testAge - 20, value: 'TEST_VALUE' };
    hierarchyMock.getValueAtTopLevel = jest.fn().mockResolvedValue(testHighLevelValue);

    const promise = strategy.delete(testKey, false);

    return promise.then(status => {
      expect(status).toEqual(AgingCacheWriteStatus.Refreshed);
      expect(hierarchyMock.deleteAtLevel).not.toBeCalledWith(testKey);
      expect(hierarchyMock.setBelowTopLevel).toBeCalledWith(testKey, testHighLevelValue);
    });
  });
});
