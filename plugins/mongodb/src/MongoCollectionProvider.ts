import { Collection, UpdateWriteOpResult } from "mongodb";

import {
  IAgedValue,
  IStorageProvider,
} from "@linkedmink/multilevel-aging-cache";
import {
  IMongoCollectionProviderOptions,
  IMongoCollectionRecord,
  MongoCollectionProviderSetMode,
} from "./IMongoCollectionProviderOptions";
import {
  getDotSeperatedPropertyValue,
  setDotSeperatedPropertyValue,
} from "./Helpers";

/**
 * Use mongodb as a persistent storage mechanism
 */
export class MongoCollectionProvider<
  TKey,
  TValue extends IMongoCollectionRecord
> implements IStorageProvider<TKey, TValue> {
  private readonly setMode: MongoCollectionProviderSetMode;
  private readonly keyProperty: string;
  private readonly modifiedDateProperty: string;

  /**
   * @param collection The collection from an active MongoClient connection with documents as values
   * @param options Configuration for this data provider
   */
  constructor(
    private readonly collection: Collection,
    options: IMongoCollectionProviderOptions<TKey, TValue>
  ) {
    this.keyProperty = options.keyProperty;
    this.modifiedDateProperty = options.modifiedDateProperty;
    this.setMode = options.setMode;
  }

  /**
   * @param key The key to retrieve
   * @returns The value if retreiving was successful or null
   */
  get(key: TKey): Promise<IAgedValue<TValue> | null> {
    return this.collection
      .findOne<IMongoCollectionRecord>({ [this.keyProperty]: key })
      .then(record => {
        if (!record) {
          return null;
        }

        const modifiedDate = getDotSeperatedPropertyValue(
          record,
          this.modifiedDateProperty
        );
        const age = modifiedDate
          ? (record.modifiedDate as Date).getTime()
          : new Date().getTime();
        return {
          age,
          value: record as TValue,
        };
      });
  }

  /**
   * @param key The key to set
   * @param value The value to set
   * @returns If setting the value was successful
   */
  set(key: TKey, value: IAgedValue<TValue>): Promise<boolean> {
    const record = value.value;
    setDotSeperatedPropertyValue(
      record,
      this.modifiedDateProperty,
      new Date(value.age)
    );

    let operation: Promise<UpdateWriteOpResult>;
    if (this.setMode == MongoCollectionProviderSetMode.Replace) {
      operation = this.collection.replaceOne(
        { [this.keyProperty]: key },
        { $set: record },
        { upsert: true }
      );
    } else {
      operation = this.collection.updateOne(
        { [this.keyProperty]: key },
        { $set: record },
        { upsert: true }
      );
    }

    return operation.then(status => status.modifiedCount > 0);
  }

  /**
   * @param key The key to the value to delete
   * @returns If deleting the value was successful
   */
  delete(key: TKey): Promise<boolean> {
    return this.collection
      .deleteOne({ [this.keyProperty]: key })
      .then(status => {
        return status.deletedCount !== undefined && status.deletedCount > 0;
      });
  }

  /**
   * @returns The keys that are currently available in the provider
   */
  keys(): Promise<TKey[]> {
    return this.collection
      .find<TValue>({})
      .map<TKey>(record => record[this.keyProperty] as TKey)
      .toArray();
  }

  /**
   * @returns The number of elements in this storage system
   */
  size(): Promise<number> {
    return this.collection.countDocuments();
  }
}
