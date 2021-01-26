import { MemoryStorageProvider } from "../../src/storage/MemoryStorageProvider";
import { setGlobalMockTransport } from "../MockTransport";

describe(MemoryStorageProvider.name, () => {
  let provider: MemoryStorageProvider<string, string>;

  beforeAll(() => {
    setGlobalMockTransport();
  });

  beforeEach(() => {
    provider = new MemoryStorageProvider();
  });

  test("should return instance when constructor parameters are valid", () => {
    expect(provider).toBeDefined();
  });

  test("should set a key/value when set is called", () => {
    const testKey = "TEST_KEY";
    const testValue = { value: "TEST_VALUE", age: 0 };

    provider.set(testKey, testValue);

    return provider.get(testKey).then(retrieved => {
      expect(retrieved).toEqual(testValue);
    });
  });

  test("should delete a key/value when delete is called", () => {
    const testKey = "TEST_KEY";
    const testValue = { value: "TEST_VALUE", age: 0 };

    provider.set(testKey, testValue);
    provider.delete(testKey);

    return provider.get(testKey).then(retrieved => {
      expect(retrieved).toBeNull();
    });
  });

  test("should return keys when keys is called", () => {
    const testKeys = ["TEST_KEY1", "TEST_KEY2", "TEST_KEY3", "TEST_KEY4"];
    const testValue = { value: "TEST_VALUE", age: 0 };

    testKeys.forEach(key => provider.set(key, testValue));

    return provider.keys().then(keys => {
      expect(keys.length).toEqual(testKeys.length);
      keys.forEach(key => expect(testKeys.includes(key)).toEqual(true));
    });
  });

  test("should return number of keys when size is called", () => {
    const testKeys = ["TEST_KEY1", "TEST_KEY2", "TEST_KEY3", "TEST_KEY4"];
    const testValue = { value: "TEST_VALUE", age: 0 };

    testKeys.forEach(key => provider.set(key, testValue));

    return provider.size().then(size => {
      expect(size).toEqual(testKeys.length);
    });
  });
});
