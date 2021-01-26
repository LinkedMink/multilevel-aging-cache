import { OverwriteAlwaysSetStrategy } from "../../../src/cache/write/OverwriteAlwaysSetStrategy";
import { StorageHierarchy } from "../../../src/storage/StorageHierarchy";
import { MockStorageHierarchy, MockAgedQueue } from "../../Mocks";
import { AgingCacheWriteStatus } from "../../../src/cache/IAgingCache";
import { setGlobalMockTransport } from "../../MockTransport";

describe(OverwriteAlwaysSetStrategy.name, () => {
  let hierarchyMock: StorageHierarchy<string, string>;
  let evictQueueMock: MockAgedQueue<string>;
  let strategy: OverwriteAlwaysSetStrategy<string, string>;

  beforeAll(() => {
    setGlobalMockTransport();
  });

  beforeEach(() => {
    hierarchyMock = (new MockStorageHierarchy() as unknown) as StorageHierarchy<
      string,
      string
    >;
    evictQueueMock = new MockAgedQueue<string>();
    strategy = new OverwriteAlwaysSetStrategy(hierarchyMock, evictQueueMock);
  });

  test("should return instance when constructor parameters are valid", () => {
    expect(strategy).toBeDefined();
  });

  test("should execute set unconditionally when set() is called", () => {
    const testKey = "TEST_KEY";
    const testValue = "TEST_VALUE";
    const testAge = 1000000;
    evictQueueMock.getInitialAge = jest.fn().mockReturnValue(testAge);

    const promise = strategy.set(testKey, testValue, false);

    return promise.then(status => {
      expect(status).toEqual(AgingCacheWriteStatus.Success);
      expect(hierarchyMock.setAtLevel).toBeCalledWith(testKey, {
        value: testValue,
        age: testAge,
      });
    });
  });
});
