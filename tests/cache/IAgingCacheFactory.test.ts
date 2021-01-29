import path from "path";
import { getDefaultAgingCacheOptions } from "../../src/cache/IAgingCacheOptions";
import * as cacheFactory from "../../src/cache/IAgingCacheFactory";
import * as cacheOptions from "../../src/cache/IAgingCacheOptions";
import { StorageHierarchy } from "../../src/storage/StorageHierarchy";
import { RefreshAlwaysSetStrategy } from "../../src/cache/write/RefreshAlwaysSetStrategy";
import { MockStorageHierarchy } from "../Mocks";
import { setGlobalMockTransport } from "../MockTransport";

const getMockStorageHierarchy = () => {
  return (new MockStorageHierarchy() as unknown) as StorageHierarchy<
    string,
    string
  >;
};

describe(path.basename(__filename, ".test.ts"), () => {
  beforeAll(() => {
    setGlobalMockTransport();
  });

  describe(cacheFactory.createAgingCache.name, () => {
    test("should return instance with default options when no options provided", () => {
      const getDefaultAgingCacheOptionsSpy = jest.spyOn(
        cacheOptions,
        "getDefaultAgingCacheOptions"
      );

      const cache = cacheFactory.createAgingCache(getMockStorageHierarchy());

      expect(cache).toBeDefined();
      expect(getDefaultAgingCacheOptionsSpy).toHaveBeenCalled();

      getDefaultAgingCacheOptionsSpy.mockRestore();
    });

    test("should return instance with specified strategy when setMode is RefreshAlways", () => {
      const options = cacheOptions.getDefaultAgingCacheOptions();
      options.setMode = cacheOptions.AgingCacheWriteMode.RefreshAlways;

      const cache = cacheFactory.createAgingCache(
        getMockStorageHierarchy(),
        options
      );

      expect(cache).toBeDefined();
      expect(
        (cache as any).setStrategy instanceof RefreshAlwaysSetStrategy
      ).toEqual(true);
    });

    test("should check and throw error when invalid options provided", () => {
      const options = cacheOptions.getDefaultAgingCacheOptions();
      options.maxEntries = -1;

      const construct = () => {
        cacheFactory.createAgingCache(getMockStorageHierarchy(), options);
      };

      expect(construct).toThrow(Error);
    });
  });

  describe(cacheFactory.checkAgingCacheOptionsValid, () => {
    test("should return undefined when valid", () => {
      const options = getDefaultAgingCacheOptions();

      const result = cacheFactory.checkAgingCacheOptionsValid(options, 2);

      expect(result).toBeUndefined();
    });

    test("should return Error when maxEntries less than 1", () => {
      const options = getDefaultAgingCacheOptions();
      options.maxEntries = 0;

      const result = cacheFactory.checkAgingCacheOptionsValid(options, 2);

      expect(result.message).toEqual("maxEntries(0): must be greater than 0");
    });

    test("should return Error when purgeInterval less than 10", () => {
      const options = getDefaultAgingCacheOptions();
      options.purgeInterval = 9;

      const result = cacheFactory.checkAgingCacheOptionsValid(options, 2);

      expect(result.message).toEqual(
        "purgeInterval(9): must be greater than 10 seconds"
      );
    });

    test("should return Error when maxEntries less than 1", () => {
      const options = getDefaultAgingCacheOptions();
      options.ageLimit = 1;
      options.purgeInterval = 61;

      const result = cacheFactory.checkAgingCacheOptionsValid(options, 2);

      expect(result.message).toEqual(
        "maxAge(1 min): must be greater than purgeInterval(61 sec)"
      );
    });

    test("should return Error when maxEntries less than 0 or more than max", () => {
      const options1 = getDefaultAgingCacheOptions();
      options1.evictAtLevel = -1;
      const options2 = getDefaultAgingCacheOptions();
      options2.evictAtLevel = 3;

      const result1 = cacheFactory.checkAgingCacheOptionsValid(options1, 2);
      const result2 = cacheFactory.checkAgingCacheOptionsValid(options2, 2);

      expect(result1.message).toEqual("evictAtLevel must be a between 0 and 2");
      expect(result2.message).toEqual("evictAtLevel must be a between 0 and 2");
    });
  });
});
