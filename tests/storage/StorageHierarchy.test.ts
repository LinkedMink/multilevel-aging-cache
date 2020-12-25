import { StorageHierarchy } from "../../src/storage/StorageHierarchy";
import { AgingCacheWriteStatus } from "../../src/cache/IAgingCache";
import { MockStorageProvider } from "../Mocks";
import { StorageHierarchyUpdatePolicy } from "../../src/storage/IStorageHierarchy";
import {
  ISubscribableStorageProvider,
  StorageProviderUpdateHandler,
} from "../../src/storage/ISubscribableStorageProvider";

describe(StorageHierarchy.name, () => {
  let levels: ISubscribableStorageProvider<string, string>[];
  let hierarchy: StorageHierarchy<string, string>;

  beforeEach(() => {
    levels = [
      new MockStorageProvider(),
      new MockStorageProvider(),
      new MockStorageProvider(),
    ];
    hierarchy = new StorageHierarchy(levels);
  });

  describe("construction/destruction", () => {
    test("should return instance subscribed to storage providers when constructor parameters are valid", () => {
      expect(levels[0].subscribe).not.toHaveBeenCalled();
      expect(levels[1].subscribe).toHaveBeenCalled();
      expect(levels[2].subscribe).toHaveBeenCalled();
      expect(hierarchy).toBeDefined();
    });

    test("should throw error when constructor parameters are invalid", () => {
      const construct = () => {
        new StorageHierarchy([]);
      };

      expect(construct).toThrow(Error);
    });

    test("should remove subscribers to storage providers when disposed", () => {
      hierarchy.dispose();

      expect(levels[0].unsubscribe).not.toHaveBeenCalled();
      expect(levels[1].unsubscribe).toHaveBeenCalled();
      expect(levels[2].unsubscribe).toHaveBeenCalled();
    });
  });

  describe("get()", () => {
    test("should get from top level when value isn't found in lower levels", () => {
      const testKey = "TEST_KEY";
      levels.forEach(level => (level.get = jest.fn().mockResolvedValue(null)));

      const promise = hierarchy.getAtLevel(testKey);

      return promise.then(result => {
        expect(result).toBeNull();
        levels.forEach(level =>
          expect(level.get).toHaveBeenCalledWith(testKey)
        );
      });
    });

    test("should get from lowest level with value when get is called", () => {
      const testKey = "TEST_KEY";
      const testValue = { value: "TEST_VALUE", age: 0 };
      levels[0].get = jest.fn().mockResolvedValue(null);
      levels[1].get = jest.fn().mockResolvedValue(testValue);
      levels[2].get = jest.fn().mockResolvedValue(testValue);

      const promise = hierarchy.getAtLevel(testKey);

      return promise.then(result => {
        expect(result).toEqual(testValue);
        expect(levels[0].get).toHaveBeenCalled();
        expect(levels[1].get).toHaveBeenCalled();
        expect(levels[2].get).not.toHaveBeenCalled();
      });
    });

    test("should get from lowest level with value when get is called and unexpected error in lower level", () => {
      const testKey = "TEST_KEY";
      const testValue = { value: "TEST_VALUE", age: 0 };
      levels[0].get = jest.fn().mockRejectedValue(new Error());
      levels[1].get = jest.fn().mockResolvedValue(testValue);
      levels[2].get = jest.fn().mockResolvedValue(testValue);

      const promise = hierarchy.getAtLevel(testKey);

      return promise.then(result => {
        expect(result).toEqual(testValue);
        expect(levels[0].get).toHaveBeenCalled();
        expect(levels[1].get).toHaveBeenCalled();
        expect(levels[2].get).not.toHaveBeenCalled();
      });
    });
  });

  describe("set()", () => {
    test("should set all levels when set is called", () => {
      const testKey = "TEST_KEY";
      const testValue = { value: "TEST_VALUE", age: 0 };
      levels.forEach(level => (level.set = jest.fn().mockResolvedValue(true)));

      const promise = hierarchy.setAtLevel(testKey, testValue);

      return promise.then(result => {
        expect(result).toEqual(AgingCacheWriteStatus.Success);
        levels.forEach(level =>
          expect(level.set).toHaveBeenCalledWith(testKey, testValue)
        );
      });
    });

    test("should set from highest level to lowest level when set fails", () => {
      const testKey = "TEST_KEY";
      const testValue = { value: "TEST_VALUE", age: 0 };
      levels[0].set = jest.fn().mockResolvedValue(true);
      levels[1].set = jest.fn().mockResolvedValue(false);
      levels[2].set = jest.fn().mockResolvedValue(true);

      const promise = hierarchy.setAtLevel(testKey, testValue);

      return promise.then(result => {
        expect(result).toEqual(AgingCacheWriteStatus.PartialWrite);
        expect(levels[0].set).not.toHaveBeenCalled();
        expect(levels[1].set).toHaveBeenCalled();
        expect(levels[2].set).toHaveBeenCalled();
      });
    });

    test("should set from highest level to lowest level when set fails unexpectedly", () => {
      const testKey = "TEST_KEY";
      const testValue = { value: "TEST_VALUE", age: 0 };
      levels[0].set = jest.fn().mockResolvedValue(true);
      levels[1].set = jest.fn().mockResolvedValue(true);
      levels[2].set = jest.fn().mockRejectedValue(new Error());

      const promise = hierarchy.setAtLevel(testKey, testValue);

      return promise.then(result => {
        expect(result).toEqual(AgingCacheWriteStatus.UnspecifiedError);
        expect(levels[0].set).not.toHaveBeenCalled();
        expect(levels[1].set).not.toHaveBeenCalled();
        expect(levels[2].set).toHaveBeenCalled();
      });
    });
  });

  describe("delete()", () => {
    test("should delete all levels when delete is called", () => {
      const testKey = "TEST_KEY";
      levels.forEach(
        level => (level.delete = jest.fn().mockResolvedValue(true))
      );

      const promise = hierarchy.deleteAtLevel(testKey);

      return promise.then(result => {
        expect(result).toEqual(AgingCacheWriteStatus.Success);
        levels.forEach(level =>
          expect(level.delete).toHaveBeenCalledWith(testKey)
        );
      });
    });

    test("should delete from highest level to lowest level when delete fails", () => {
      const testKey = "TEST_KEY";
      levels[0].delete = jest.fn().mockResolvedValue(true);
      levels[1].delete = jest.fn().mockResolvedValue(false);
      levels[2].delete = jest.fn().mockResolvedValue(true);

      const promise = hierarchy.deleteAtLevel(testKey);

      return promise.then(result => {
        expect(result).toEqual(AgingCacheWriteStatus.PartialWrite);
        expect(levels[0].delete).not.toHaveBeenCalled();
        expect(levels[1].delete).toHaveBeenCalled();
        expect(levels[2].delete).toHaveBeenCalled();
      });
    });

    test("should delete from highest level to lowest level when delete fails unexpectedly", () => {
      const testKey = "TEST_KEY";
      levels[0].delete = jest.fn().mockResolvedValue(true);
      levels[1].delete = jest.fn().mockResolvedValue(true);
      levels[2].delete = jest.fn().mockRejectedValue(new Error());

      const promise = hierarchy.deleteAtLevel(testKey);

      return promise.then(result => {
        expect(result).toEqual(AgingCacheWriteStatus.UnspecifiedError);
        expect(levels[0].delete).not.toHaveBeenCalled();
        expect(levels[1].delete).not.toHaveBeenCalled();
        expect(levels[2].delete).toHaveBeenCalled();
      });
    });
  });

  describe("get/set misc", () => {
    test("should get size of level when getSizeAtLevel() is called", () => {
      const testSize = 3;
      const testLevel = 0;
      levels[testLevel].size = jest.fn().mockResolvedValue(testSize);

      const promise = hierarchy.getSizeAtLevel(testLevel);

      return promise.then(result => {
        expect(result).toEqual(testSize);
        expect(levels[testLevel].size).toHaveBeenCalled();
      });
    });

    test("should all keys when getKeysAtTopLevel() is called", () => {
      const testKeys = ["TEST_KEY1", "TEST_KEY2", "TEST_KEY3", "TEST_KEY4"];
      levels[2].keys = jest.fn().mockResolvedValue(testKeys);

      const promise = hierarchy.getKeysAtTopLevel();

      return promise.then(result => {
        expect(result).toEqual(testKeys);
        expect(levels[2].keys).toHaveBeenCalled();
      });
    });

    test("should value in reverse direction when getValueAtTopLevel() is called", () => {
      const testKey = "TEST_KEY";
      const testValue = { value: "TEST_VALUE", age: 0 };
      levels.forEach(
        level => (level.get = jest.fn().mockResolvedValue(testValue))
      );

      const promise = hierarchy.getValueAtTopLevel(testKey);

      return promise.then(result => {
        expect(result).toEqual(testValue);
        expect(levels[0].get).not.toHaveBeenCalled();
        expect(levels[1].get).not.toHaveBeenCalled();
        expect(levels[2].get).toHaveBeenCalled();
      });
    });

    test("should value in bottom level only when getValueAtBottomLevel() is called", () => {
      const testKey = "TEST_KEY";
      levels.forEach(level => (level.get = jest.fn().mockResolvedValue(null)));

      const promise = hierarchy.getValueAtBottomLevel(testKey);

      return promise.then(result => {
        expect(result).toBeNull();
        expect(levels[0].get).toHaveBeenCalled();
        expect(levels[1].get).not.toHaveBeenCalled();
        expect(levels[2].get).not.toHaveBeenCalled();
      });
    });

    test("should set only levels below highest when setBelowTopLevel() is called", () => {
      const testKey = "TEST_KEY";
      const testValue = { value: "TEST_VALUE", age: 0 };
      levels.forEach(level => (level.set = jest.fn().mockResolvedValue(true)));

      const promise = hierarchy.setBelowTopLevel(testKey, testValue);

      return promise.then(result => {
        expect(result).toEqual(AgingCacheWriteStatus.Success);
        expect(levels[0].set).toHaveBeenCalled();
        expect(levels[1].set).toHaveBeenCalled();
        expect(levels[2].set).not.toHaveBeenCalled();
      });
    });
  });

  describe("subscribe() provider set/delete", () => {
    test("should set lower levels when higher level storage provider calls subscribers for update policy Always", () => {
      const testKey = "TEST_KEY";
      const testValue = { value: "TEST_VALUE", age: 0 };
      levels.forEach(level => (level.set = jest.fn().mockResolvedValue(true)));
      let subscriptionFunc: StorageProviderUpdateHandler<
        string,
        string
      > = () => {
        return;
      };
      levels[2].subscribe = func => {
        subscriptionFunc = func;
        return true;
      };
      hierarchy = new StorageHierarchy(
        levels,
        StorageHierarchyUpdatePolicy.Always
      );
      const setAtLevelSpy = jest.spyOn(hierarchy, "setAtLevel");

      subscriptionFunc(testKey, testValue);

      expect(setAtLevelSpy).toHaveBeenCalledWith(testKey, testValue, 1);
    });

    test("should delete lower levels when higher level storage provider calls subscribers for update policy Always", () => {
      const testKey = "TEST_KEY";
      levels.forEach(
        level => (level.delete = jest.fn().mockResolvedValue(true))
      );
      let subscriptionFunc: StorageProviderUpdateHandler<
        string,
        string
      > = () => {
        return;
      };
      levels[2].subscribe = func => {
        subscriptionFunc = func;
        return true;
      };
      hierarchy = new StorageHierarchy(
        levels,
        StorageHierarchyUpdatePolicy.Always
      );
      const deleteAtLevelSpy = jest.spyOn(hierarchy, "deleteAtLevel");

      subscriptionFunc(testKey);

      expect(deleteAtLevelSpy).toHaveBeenCalledWith(testKey, 1);
    });

    test("should set lower levels when higher level storage provider updates key that exist for update policy OnlyIfKeyExist", () => {
      const testKey = "TEST_KEY";
      const testValue = { value: "TEST_VALUE", age: 0 };
      const testValueUpdated = { value: "TEST_VALUE2", age: 1 };
      levels.forEach(level => (level.set = jest.fn().mockResolvedValue(true)));
      let subscriptionFunc: StorageProviderUpdateHandler<
        string,
        string
      > = () => {
        return;
      };
      levels[2].subscribe = func => {
        subscriptionFunc = func;
        return true;
      };
      levels[1].get = jest.fn().mockResolvedValue(testValue);
      hierarchy = new StorageHierarchy(
        levels,
        StorageHierarchyUpdatePolicy.OnlyIfKeyExist
      );
      const setAtLevelSpy = jest.spyOn(hierarchy, "setAtLevel");

      subscriptionFunc(testKey, testValueUpdated);

      return hierarchy.dispose().then(() => {
        expect(setAtLevelSpy).toHaveBeenCalledWith(
          testKey,
          testValueUpdated,
          1
        );
      });
    });

    test("should delete lower levels when higher level storage provider updates key that exist for update policy OnlyIfKeyExist", () => {
      const testKey = "TEST_KEY";
      const testValue = { value: "TEST_VALUE", age: 0 };
      levels.forEach(
        level => (level.delete = jest.fn().mockResolvedValue(true))
      );
      let subscriptionFunc: StorageProviderUpdateHandler<
        string,
        string
      > = () => {
        return;
      };
      levels[2].subscribe = func => {
        subscriptionFunc = func;
        return true;
      };
      levels[1].get = jest.fn().mockResolvedValue(testValue);
      hierarchy = new StorageHierarchy(
        levels,
        StorageHierarchyUpdatePolicy.OnlyIfKeyExist
      );
      const deleteAtLevelSpy = jest.spyOn(hierarchy, "deleteAtLevel");

      subscriptionFunc(testKey);

      return hierarchy.dispose().then(() => {
        expect(deleteAtLevelSpy).toHaveBeenCalledWith(testKey, 1);
      });
    });

    test("should not set lower levels when higher level storage provider updates key that doesn't exist for update policy OnlyIfKeyExist", () => {
      const testKey = "TEST_KEY";
      const testValue = { value: "TEST_VALUE", age: 0 };
      levels.forEach(level => (level.set = jest.fn().mockResolvedValue(true)));
      let subscriptionFunc: StorageProviderUpdateHandler<
        string,
        string
      > = () => {
        return;
      };
      levels[2].subscribe = func => {
        subscriptionFunc = func;
        return true;
      };
      levels[1].get = jest.fn().mockResolvedValue(null);
      hierarchy = new StorageHierarchy(
        levels,
        StorageHierarchyUpdatePolicy.OnlyIfKeyExist
      );
      const setAtLevelSpy = jest.spyOn(hierarchy, "setAtLevel");

      subscriptionFunc(testKey, testValue);

      return hierarchy.dispose().then(() => {
        expect(setAtLevelSpy).not.toHaveBeenCalledWith(testKey, testValue, 1);
      });
    });
  });
});
