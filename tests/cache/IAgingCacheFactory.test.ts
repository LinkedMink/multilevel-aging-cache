import { getDefaultAgingCacheOptions } from "../../src/cache/IAgingCacheOptions";
import * as cacheFactory from "../../src/cache/IAgingCacheFactory";
import * as cacheOptions from "../../src/cache/IAgingCacheOptions";
import { StorageHierarchy } from "../../src/storage/StorageHierarchy";
import { RefreshAlwaysSetStrategy } from "../../src/cache/write/RefreshAlwaysSetStrategy";
import { MockStorageHierarchy } from "../Mocks";

const getMockStorageHierarchy = () => {
  return (new MockStorageHierarchy() as unknown) as StorageHierarchy<
    string,
    string
  >;
};

describe(__filename, () => {
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

      const result = cacheFactory.checkAgingCacheOptionsValid(options);

      expect(result).toBeUndefined();
    });

    test("should return Error when maxEntries less than 1", () => {
      const options = getDefaultAgingCacheOptions();
      options.maxEntries = 0;

      const result = cacheFactory.checkAgingCacheOptionsValid(options);
      if (!result) {
        throw Error("Unexpected Output");
      }

      expect(result.message).toEqual("maxEntries(0): must be greater than 0");
    });

    test("should return Error when purgeInterval less than 10", () => {
      const options = getDefaultAgingCacheOptions();
      options.purgeInterval = 9;

      const result = cacheFactory.checkAgingCacheOptionsValid(options);
      if (!result) {
        throw Error("Unexpected Output");
      }

      expect(result.message).toEqual(
        "purgeInterval(9): must be greater than 10 seconds"
      );
    });

    test("should return Error when maxEntries less than 1", () => {
      const options = getDefaultAgingCacheOptions();
      options.ageLimit = 1;
      options.purgeInterval = 61;

      const result = cacheFactory.checkAgingCacheOptionsValid(options);
      if (!result) {
        throw Error("Unexpected Output");
      }

      expect(result.message).toEqual(
        "maxAge(1 min): must be greater than purgeInterval(61 sec)"
      );
    });
  });
});
