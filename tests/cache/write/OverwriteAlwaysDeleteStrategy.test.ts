import { OverwriteAlwaysDeleteStrategy } from "../../../src/cache/write/OverwriteAlwaysDeleteStrategy";
import { StorageHierarchy } from "../../../src/storage/StorageHierarchy";
import { MockStorageHierarchy, MockAgedQueue } from "../../Mocks";
import { AgingCacheWriteStatus } from "../../../src/cache/IAgingCache";
import { setGlobalMockTransport } from "../../MockTransport";

describe(OverwriteAlwaysDeleteStrategy.name, () => {
  let hierarchyMock: StorageHierarchy<string, string>;
  let evictQueueMock: MockAgedQueue<string>;
  let strategy: OverwriteAlwaysDeleteStrategy<string, string>;

  beforeAll(() => {
    setGlobalMockTransport();
  });

  beforeEach(() => {
    hierarchyMock = (new MockStorageHierarchy() as unknown) as StorageHierarchy<string, string>;
    evictQueueMock = new MockAgedQueue<string>();
    strategy = new OverwriteAlwaysDeleteStrategy(hierarchyMock, evictQueueMock);
  });

  test("should return instance when constructor parameters are valid", () => {
    expect(strategy).toBeDefined();
  });

  test("should execute delete unconditionally when delete() is called", () => {
    const testKey = "TEST_KEY";

    const promise = strategy.delete(testKey, false);

    return promise.then(status => {
      expect(status).toEqual(AgingCacheWriteStatus.Success);
      expect(hierarchyMock.deleteAtLevel).toBeCalledWith(testKey);
    });
  });
});
