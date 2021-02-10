import { RedisProvider } from "../src/RedisProvider";
import { getStringKeyJsonValueOptions, IRedisProviderOptions } from "../src/IRedisProviderOptions";
import { Redis as IRedis } from "ioredis";
import { MockSerializer } from "../../../tests/Mocks";
import { setGlobalMockTransport } from "../../../tests/MockTransport";

const Redis = require("ioredis-mock");

describe(RedisProvider.name, () => {
  const mockSerializer = new MockSerializer();

  beforeAll(() => {
    setGlobalMockTransport();
  });

  let clientMock: IRedis;
  let optionsMock: IRedisProviderOptions<string, string>;
  let provider: RedisProvider<string, string>;

  beforeEach(() => {
    clientMock = new Redis();
    optionsMock = {
      keyPrefix: "PREFIX",
      keySerializer: new MockSerializer(),
      valueSerializer: new MockSerializer(),
      isPersistable: true,
    };

    provider = new RedisProvider(clientMock, optionsMock);
  });

  test("should return instance when constructor parameters are valid", () => {
    const provider = new RedisProvider(new Redis(), getStringKeyJsonValueOptions());

    expect(provider).toBeDefined();
  });

  test("should call Redis client get with serialized key when get is called", () => {
    const getSpy = jest.spyOn(clientMock, "get");
    const testKey = "TEST_KEY";

    const getPromise = provider.get(testKey);

    return getPromise.then(retrieved => {
      expect(retrieved).toBeNull();
      expect(getSpy).toHaveBeenCalledWith(mockSerializer.serialize(testKey));
    });
  });

  test("should call Redis client get and deserialized stored value when get is called", () => {
    const testKey = "TEST_KEY";
    const testValue = "TEST_VALUE";
    const testSerializedValue = {
      value: mockSerializer.serialize(testValue),
      age: 0,
    };
    const getSpy = jest
      .spyOn(clientMock, "get")
      .mockReturnValue(Promise.resolve(JSON.stringify(testSerializedValue)));

    const promise = provider.get(testKey);

    return promise.then(retrieved => {
      if (retrieved === null) {
        throw Error();
      }

      expect(retrieved.value).toEqual(testValue);
      expect(getSpy).toHaveBeenCalledWith(mockSerializer.serialize(testKey));
    });
  });

  test("should call Redis client keys when keys is called", () => {
    const testKeys = ["TEST_KEY1", "TEST_KEY2", "TEST_KEY3", "TEST_KEY4"];
    const keysSpy = jest
      .spyOn(clientMock, "keys")
      .mockReturnValue(Promise.resolve(testKeys.map(key => mockSerializer.serialize(key))));

    const promise = provider.keys();

    return promise.then(keys => {
      expect(keysSpy).toHaveBeenCalled();
      expect(keys.length).toEqual(testKeys.length);
      keys.forEach(key => expect(testKeys.includes(key)).toEqual(true));
    });
  });

  test("should call Redis client keys when size is called", () => {
    const testKeys = ["TEST_KEY1", "TEST_KEY2", "TEST_KEY3", "TEST_KEY4"];
    const keysSpy = jest
      .spyOn(clientMock, "keys")
      .mockReturnValue(Promise.resolve(testKeys.map(key => mockSerializer.serialize(key))));

    const promise = provider.size();

    return promise.then(size => {
      expect(keysSpy).toHaveBeenCalled();
      expect(size).toEqual(testKeys.length);
    });
  });
});
