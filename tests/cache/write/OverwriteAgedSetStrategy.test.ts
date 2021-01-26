import { OverwriteAgedSetStrategy } from "../../../src/cache/write/OverwriteAgedSetStrategy";
import { StorageHierarchy } from "../../../src/storage/StorageHierarchy";
import { MockStorageHierarchy, MockAgedQueue } from "../../Mocks";
import { AgingCacheWriteStatus } from "../../../src/cache/IAgingCache";
import { setGlobalMockTransport } from "../../MockTransport";

describe(OverwriteAgedSetStrategy.name, () => {
  let hierarchyMock: StorageHierarchy<string, string>;
  let evictQueueMock: MockAgedQueue<string>;
  let strategy: OverwriteAgedSetStrategy<string, string>;

  beforeAll(() => {
    setGlobalMockTransport();
  });

  beforeEach(() => {
    hierarchyMock = (new MockStorageHierarchy() as unknown) as StorageHierarchy<
      string,
      string
    >;
    evictQueueMock = new MockAgedQueue<string>();
    strategy = new OverwriteAgedSetStrategy(hierarchyMock, evictQueueMock);
  });

  test("should return instance when constructor parameters are valid", () => {
    expect(strategy).toBeDefined();
  });

  test("should execute set unconditionally when set() is called with force", () => {
    const testKey = "TEST_KEY";
    const testValue = "TEST_VALUE";
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

  test("should execute set when set() is called and highest level has key with lower age", () => {
    const testKey = "TEST_KEY";
    const testValue = "TEST_VALUE";
    const testAge = 1000000;
    evictQueueMock.getInitialAge = jest.fn().mockReturnValue(testAge);
    const testHighLevelValue = { age: testAge - 20, value: testValue };
    hierarchyMock.getValueAtTopLevel = jest
      .fn()
      .mockResolvedValue(testHighLevelValue);

    const promise = strategy.set(testKey, testValue, false);

    return promise.then(status => {
      expect(status).toEqual(AgingCacheWriteStatus.Success);
      expect(hierarchyMock.setAtLevel).toBeCalledWith(testKey, {
        value: testValue,
        age: testAge,
      });
    });
  });

  test("should not execute set when set() is called and highest level has key with higher age", () => {
    const testKey = "TEST_KEY";
    const testValue = "TEST_VALUE";
    const testAge = 1000000;
    evictQueueMock.getInitialAge = jest.fn().mockReturnValue(testAge);
    const testHighLevelValue = { age: testAge + 20, value: testValue };
    hierarchyMock.getValueAtTopLevel = jest
      .fn()
      .mockResolvedValue(testHighLevelValue);

    const promise = strategy.set(testKey, testValue, false);

    return promise.then(status => {
      expect(status).toEqual(AgingCacheWriteStatus.Refreshed);
      expect(hierarchyMock.setAtLevel).not.toBeCalledWith(testKey, {
        value: testValue,
        age: testAge,
      });
      expect(hierarchyMock.setBelowTopLevel).toBeCalledWith(
        testKey,
        testHighLevelValue
      );
    });
  });
});
