import { OverwriteAgedDeleteStrategy } from 'cache/OverwriteAgedDeleteStrategy';
import { StorageHierarchy } from 'storage/StorageHierarchy';
import { MockStorageHierarchy, MockAgedQueue } from '../Mocks';
import { AgingCacheWriteStatus } from 'cache/IAgingCache';
import { setGlobalMockTransport } from '../MockTransport';

describe(OverwriteAgedDeleteStrategy.name, () => {
  let hierarchyMock: StorageHierarchy<string, string>;
  let evictQueueMock: MockAgedQueue<string>;
  let strategy: OverwriteAgedDeleteStrategy<string, string>;

  beforeAll(() => {
    setGlobalMockTransport();
  });

  beforeEach(() => {
    hierarchyMock = new MockStorageHierarchy() as unknown as StorageHierarchy<string, string>;
    evictQueueMock = new MockAgedQueue<string>();
    strategy = new OverwriteAgedDeleteStrategy(hierarchyMock, evictQueueMock);
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

  test('should execute delete when delete() is called and highest level has key with lower age', () => {
    const testKey = 'TEST_KEY';
    const testAge = 1000000;
    const testHighLevelValue = { age: testAge - 20, value: 'TEST_VALUE' };
    hierarchyMock.getValueAtBottomLevel = jest
      .fn()
      .mockResolvedValue({ age: testAge, value: 'TEST_VALUE' });
    hierarchyMock.getValueAtTopLevel = jest.fn().mockResolvedValue(testHighLevelValue);

    const promise = strategy.delete(testKey, false);

    return promise.then(status => {
      expect(status).toEqual(AgingCacheWriteStatus.Success);
      expect(hierarchyMock.deleteAtLevel).toBeCalledWith(testKey);
    });
  });

  test('should not execute delete when delete() is called and highest level has key and lowest level is missing key', () => {
    const testKey = 'TEST_KEY';
    const testAge = 1000000;
    const testHighLevelValue = { age: testAge + 20, value: 'TEST_VALUE' };
    hierarchyMock.getValueAtBottomLevel = jest.fn().mockResolvedValue(null);
    hierarchyMock.getValueAtTopLevel = jest.fn().mockResolvedValue(testHighLevelValue);

    const promise = strategy.delete(testKey, false);

    return promise.then(status => {
      expect(status).toEqual(AgingCacheWriteStatus.Refreshed);
      expect(hierarchyMock.deleteAtLevel).not.toBeCalledWith(testKey);
      expect(hierarchyMock.setBelowTopLevel).toBeCalledWith(testKey, testHighLevelValue);
    });
  });

  test('should not execute delete when delete() is called and highest level has key with higher age', () => {
    const testKey = 'TEST_KEY';
    const testAge = 1000000;
    const testHighLevelValue = { age: testAge + 20, value: 'TEST_VALUE' };
    hierarchyMock.getValueAtBottomLevel = jest
      .fn()
      .mockResolvedValue({ age: testAge, value: 'TEST_VALUE' });
    hierarchyMock.getValueAtTopLevel = jest.fn().mockResolvedValue(testHighLevelValue);

    const promise = strategy.delete(testKey, false);

    return promise.then(status => {
      expect(status).toEqual(AgingCacheWriteStatus.Refreshed);
      expect(hierarchyMock.deleteAtLevel).not.toBeCalledWith(testKey);
      expect(hierarchyMock.setBelowTopLevel).toBeCalledWith(testKey, testHighLevelValue);
    });
  });
});
