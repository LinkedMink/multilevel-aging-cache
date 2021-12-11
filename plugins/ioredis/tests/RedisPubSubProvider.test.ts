import { RedisPubSubProvider } from 'RedisPubSubProvider';
import { getStringKeyJsonValueOptions, IRedisProviderOptions } from 'IRedisProviderOptions';
import { Redis as IRedis } from 'ioredis';
import { MockSerializer } from '../../../main/tests/Mocks';
import { setGlobalMockTransport } from '../../../main/tests/MockTransport';

const Redis = require('ioredis-mock');

const PUBLISH_CHANNEL = 'PublishedKey';

describe(RedisPubSubProvider.name, () => {
  const mockSerializer = new MockSerializer();

  let clientMock: IRedis;
  let channelMock: IRedis;
  let optionsMock: IRedisProviderOptions<string, string>;
  let provider: RedisPubSubProvider<string, string>;

  beforeAll(() => {
    setGlobalMockTransport();
  });

  beforeEach(() => {
    clientMock = new Redis();
    channelMock = new Redis();
    optionsMock = {
      keyPrefix: 'PREFIX',
      keySerializer: new MockSerializer(),
      valueSerializer: new MockSerializer(),
      isPersistable: true,
    };

    provider = new RedisPubSubProvider(clientMock, channelMock, optionsMock);
  });

  test('should return instance when constructor parameters are valid', () => {
    const provider = new RedisPubSubProvider(
      new Redis(),
      new Redis(),
      getStringKeyJsonValueOptions()
    );

    expect(provider).toBeDefined();
  });

  test('should call Redis client get with serialized key when get is called', () => {
    const getSpy = jest.spyOn(clientMock, 'get');
    const testKey = 'TEST_KEY';

    const getPromise = provider.get(testKey);

    return getPromise.then(retrieved => {
      expect(retrieved).toBeNull();
      expect(getSpy).toHaveBeenCalledWith(mockSerializer.serialize(testKey));
    });
  });

  test('should call Redis client get and deserialized stored value when get is called', () => {
    const testKey = 'TEST_KEY';
    const testValue = 'TEST_VALUE';
    const testSerializedValue = {
      value: mockSerializer.serialize(testValue),
      age: 0,
    };
    const getSpy = jest
      .spyOn(clientMock, 'get')
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

  test('should call Redis client set with serialized key/value when set is called', () => {
    const setSpy = jest
      .spyOn(clientMock, 'set')
      .mockReturnValue(Promise.resolve('OK') as unknown as undefined);
    const publishSpy = jest.spyOn(channelMock, 'publish').mockResolvedValue(1);
    const testKey = 'TEST_KEY';
    const testValue = { value: 'TEST_VALUE', age: 0 };

    const promise = provider.set(testKey, testValue);

    return promise.then(isSuccessful => {
      expect(isSuccessful).toEqual(true);
      const serializedAgedValue = JSON.stringify({
        age: testValue.age,
        value: mockSerializer.serialize(testValue.value),
      });
      expect(setSpy).toHaveBeenCalledWith(mockSerializer.serialize(testKey), serializedAgedValue);
      expect(publishSpy).toHaveBeenCalledWith(
        optionsMock.keyPrefix + PUBLISH_CHANNEL,
        JSON.stringify({
          key: mockSerializer.serialize(testKey),
          age: testValue.age,
          value: mockSerializer.serialize(testValue.value),
        })
      );
    });
  });

  test('should call Redis client del with serialized key when set is called', () => {
    const deleteSpy = jest.spyOn(clientMock, 'del').mockResolvedValue(1);
    const publishSpy = jest.spyOn(channelMock, 'publish').mockResolvedValue(1);
    const testKey = 'TEST_KEY';

    const promise = provider.delete(testKey);

    return promise.then(isSuccessful => {
      expect(isSuccessful).toEqual(true);
      expect(deleteSpy).toHaveBeenCalledWith(mockSerializer.serialize(testKey));
      expect(publishSpy).toHaveBeenCalledWith(
        optionsMock.keyPrefix + PUBLISH_CHANNEL,
        JSON.stringify({ key: mockSerializer.serialize(testKey) })
      );
    });
  });

  test('should call Redis client keys when keys is called', () => {
    const testKeys = ['TEST_KEY1', 'TEST_KEY2', 'TEST_KEY3', 'TEST_KEY4'];
    const keysSpy = jest
      .spyOn(clientMock, 'keys')
      .mockReturnValue(Promise.resolve(testKeys.map(key => mockSerializer.serialize(key))));

    const promise = provider.keys();

    return promise.then(keys => {
      expect(keysSpy).toHaveBeenCalled();
      expect(keys.length).toEqual(testKeys.length);
      keys.forEach(key => expect(testKeys.includes(key)).toEqual(true));
    });
  });

  test('should call Redis client keys when size is called', () => {
    const testKeys = ['TEST_KEY1', 'TEST_KEY2', 'TEST_KEY3', 'TEST_KEY4'];
    const keysSpy = jest
      .spyOn(clientMock, 'keys')
      .mockReturnValue(Promise.resolve(testKeys.map(key => mockSerializer.serialize(key))));

    const promise = provider.size();

    return promise.then(size => {
      expect(keysSpy).toHaveBeenCalled();
      expect(size).toEqual(testKeys.length);
    });
  });

  test('should not allow duplicates when attempting to subscribe the same function', () => {
    const subscriber = jest.fn();

    provider.subscribe(subscriber);
    const isDuplicateSubscribed = provider.subscribe(subscriber);

    expect(isDuplicateSubscribed).toEqual(false);
  });

  test('should delete subscriber when it exist', () => {
    const subscriber = jest.fn();
    provider.subscribe(subscriber);

    const isDeleted = provider.unsubscribe(subscriber);

    expect(isDeleted).toEqual(true);
  });

  test('should not delete subscriber when it does not exist', () => {
    const subscriber = jest.fn();

    const isDeleted = provider.unsubscribe(subscriber);

    expect(isDeleted).toEqual(false);
  });

  test('should call Redis client subscribe when listen is called for the first time', () => {
    const subscribeSpy = jest.spyOn(channelMock, 'subscribe').mockResolvedValue(1);

    const promise = provider.listen();

    return promise.then(isListening => {
      expect(subscribeSpy).toHaveBeenCalled();
    });
  });

  test('should not call Redis client subscribe when listen is called multiple times', () => {
    const subscribeSpy = jest.spyOn(channelMock, 'subscribe').mockResolvedValue(1);

    return provider.listen().then(isListening => {
      return provider.listen().then(() => {
        expect(subscribeSpy).toHaveBeenCalledTimes(1);
      });
    });
  });

  test('should notify subscribers of delete when message is published', () => {
    const testKey = 'TEST_KEY';
    const testMessage = JSON.stringify({
      key: mockSerializer.serialize(testKey),
    });
    const subscriber = jest.fn();
    provider.subscribe(subscriber);

    return provider.listen().then(isListening => {
      channelMock.emit('message', optionsMock.keyPrefix + PUBLISH_CHANNEL, testMessage);
      expect(subscriber).toHaveBeenCalledWith(testKey, undefined);
    });
  });

  test('should notify subscribers of delete when message is published', () => {
    const testKey = 'TEST_KEY';
    const testValue = { value: 'TEST_VALUE', age: 0 };
    const testMessage = JSON.stringify({
      key: mockSerializer.serialize(testKey),
      value: mockSerializer.serialize(testValue.value),
      age: testValue.age,
    });
    const subscriber = jest.fn();
    provider.subscribe(subscriber);

    return provider.listen().then(isListening => {
      channelMock.emit('message', optionsMock.keyPrefix + PUBLISH_CHANNEL, testMessage);
      expect(subscriber).toHaveBeenCalledWith(testKey, testValue);
    });
  });

  test('should not notify subscribers when message is published for other channels', () => {
    const subscriber = jest.fn();
    provider.subscribe(subscriber);

    return provider.listen().then(isListening => {
      channelMock.emit('message', 'TEST_CHANNEL', 'TEST_MESSAGE');
      expect(subscriber).not.toHaveBeenCalled();
    });
  });
});
