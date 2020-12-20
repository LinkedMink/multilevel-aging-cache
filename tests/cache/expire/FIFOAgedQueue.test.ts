import { FIFOAgedQueue } from "../../../src/cache/expire/FIFOAgedQueue";

describe(FIFOAgedQueue.name, () => {
  let queue: FIFOAgedQueue<string>;

  beforeEach(() => {
    queue = new FIFOAgedQueue();
  });

  test("should update age to current date when key exist", () => {
    const testKey = "TEST_KEY";
    const testDate = 1000000;
    jest.spyOn(Date, "now").mockReturnValue(testDate);
    queue.addOrReplace(testKey, testDate - 20);

    queue.updateAge(testKey);

    expect((queue as any).ageMap.get(testKey)).toEqual(testDate);
  });

  test("should replace age and not add duplicates when duplicate key is added", () => {
    const testKey = "TEST_KEY";
    const testDate = 1000000;
    jest.spyOn(Date, "now").mockReturnValue(testDate);
    queue.addOrReplace(testKey, testDate - 20);

    queue.addOrReplace(testKey);

    expect((queue as any).ageMap.get(testKey)).toEqual(testDate);
    expect(queue.size()).toEqual(1);
  });

  test("should order entered keys by age when adding explicit ages", () => {
    const testAge = 1000000;
    const testKeys = [
      { key: "TEST_KEY1", age: testAge + 50 },
      { key: "TEST_KEY2", age: testAge - 30 },
      { key: "TEST_KEY3", age: testAge - 20 },
      { key: "TEST_KEY4", age: testAge + 20 },
      { key: "TEST_KEY5", age: testAge - 40 },
    ];

    testKeys.forEach(keyAge => {
      queue.addOrReplace(keyAge.key, keyAge.age);
    });

    const next1 = queue.next() as string;
    queue.delete(next1);
    const next2 = queue.next() as string;
    queue.delete(next2);
    const next3 = queue.next() as string;
    queue.delete(next3);
    const next4 = queue.next() as string;
    queue.delete(next4);
    const next5 = queue.next() as string;

    expect(next1).toEqual(testKeys[4].key);
    expect(next2).toEqual(testKeys[1].key);
    expect(next3).toEqual(testKeys[2].key);
    expect(next4).toEqual(testKeys[3].key);
    expect(next5).toEqual(testKeys[0].key);
  });

  describe("isNextExpired()", () => {
    test("should return false when queue is empty", () => {
      const isExpired = queue.isNextExpired();

      expect(isExpired).toEqual(false);
    });

    test("should return true when maximum size is exceeded", () => {
      queue = new FIFOAgedQueue(3, 1);
      queue.addOrReplace("TEST_KEY1");
      queue.addOrReplace("TEST_KEY2");
      queue.addOrReplace("TEST_KEY3");
      queue.addOrReplace("TEST_KEY4");

      const isExpired = queue.isNextExpired();

      expect(isExpired).toEqual(true);
    });

    test("should return true when age limit is exceeded", () => {
      const ageLimit = 1;
      const ageLimitMilliseconds = ageLimit * 60 * 1000;
      queue = new FIFOAgedQueue(undefined, ageLimit);
      const testKey = "TEST_KEY";
      const testDate = 1000000;
      jest.spyOn(Date, "now").mockReturnValue(testDate);
      queue.addOrReplace(testKey, testDate - ageLimitMilliseconds - 1);

      const isExpired = queue.isNextExpired();

      expect(isExpired).toEqual(true);
    });
  });
});
