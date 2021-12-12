import { IAgedValue } from '@linkedmink/multilevel-aging-cache';
import { Collection, Document, MongoClient, ObjectId } from 'mongodb';
import { getDefaultOptions, IMongoRecord } from 'IMongoProviderOptions';
import { MongoProvider } from 'MongoProvider';
import { setGlobalMockTransport } from './MockTransport';

interface TestRecord extends IMongoRecord {
  value: string;
}

const getAgedTestRecord = (id: ObjectId, value: string): IAgedValue<TestRecord> => {
  const age = new Date().getTime();
  return {
    age,
    value: {
      createdDate: new Date(age),
      value,
    },
  };
};

describe(MongoProvider.name, () => {
  let connection: MongoClient;
  let dbCollection: Collection<TestRecord>;
  let provider: MongoProvider<ObjectId, TestRecord>;

  beforeAll(async () => {
    setGlobalMockTransport();
    connection = await MongoClient.connect(process.env.MONGO_URL as string);
    dbCollection = (await connection.db()).collection<TestRecord>('TEST');
  });

  afterAll(async () => {
    await connection.close();
  });

  beforeEach(() => {
    provider = new MongoProvider(
      dbCollection as unknown as Collection<Document>,
      getDefaultOptions()
    );
  });

  test('should return instance when constructor parameters are valid', () => {
    expect(provider).toBeDefined();
  });

  test('should set a key/value when set is called', () => {
    const testKey = new ObjectId('5fe526653b607d92a76653c8');
    const testValue = getAgedTestRecord(testKey, 'TEST_VALUE');

    provider.set(testKey, testValue);

    return provider.get(testKey).then(retrieved => {
      expect(retrieved).toEqual({
        age: testValue.age,
        value: expect.objectContaining(testValue.value),
      });
    });
  });

  test('should delete a key/value when delete is called', () => {
    const testKey = new ObjectId('5fe5267090e73a5cfd33c932');
    const testValue = getAgedTestRecord(testKey, 'TEST_VALUE');

    provider.set(testKey, testValue);
    provider.delete(testKey);

    return provider.get(testKey).then(retrieved => {
      expect(retrieved).toBeNull();
    });
  });

  test('should return keys when keys is called', () => {
    const testKeys = [
      new ObjectId('5fe52675f8c5dc7bfb607e4c'),
      new ObjectId('5fe5267f815640feb568dd99'),
      new ObjectId('5fe52687e8605e3c37c35a9f'),
      new ObjectId('5fe5268f6d041f71f1d3ecf2'),
    ];

    testKeys.forEach(key => provider.set(key, getAgedTestRecord(key, 'TEST_VALUE')));

    return provider.keys().then(keys => {
      expect(keys.length).toBeGreaterThanOrEqual(testKeys.length);
      testKeys.forEach(key => expect(keys.find(k => k.equals(key))).not.toBeUndefined());
    });
  });

  test('should return number of keys when size is called', () => {
    const testKeys = [
      new ObjectId('5fe52698640fa041de3b19b6'),
      new ObjectId('5fe526a000ed4636879a26bd'),
      new ObjectId('5fe526a7293343741e3db226'),
      new ObjectId('5fe526aede2255840ed0fdb8'),
    ];

    testKeys.forEach(key => provider.set(key, getAgedTestRecord(key, 'TEST_VALUE')));

    return provider.size().then(size => {
      expect(size).toBeGreaterThanOrEqual(testKeys.length);
    });
  });
});
