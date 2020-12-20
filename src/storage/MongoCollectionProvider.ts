import { Collection, ObjectID, UpdateWriteOpResult } from "mongodb";

import { IStorageProvider } from "./IStorageProvider";
import { IAgedValue } from "../cache/expire/IAgedQueue";
import {
  IMongoCollectionProviderOptions,
  MongoCollectioonProviderSetMode,
} from "./IMongoCollectionProviderOptions";

/**
 * A MongoDB record that has fields to track when it's written.
 */
export interface IMongoCollectionRecord {
  _id: ObjectID;
  createdDate: Date;
  modifiedDate: Date;
  [property: string]: unknown;
}

/**
 *
 */
export class MongoCollectionProvider<
  TKey,
  TValue extends IMongoCollectionRecord
> implements IStorageProvider<TKey, TValue> {
  private readonly setMode: MongoCollectioonProviderSetMode;
  private readonly keyProperty: string;

  /**
   * @param collection The collection from an active MongoClient connection with documents as values
   * @param options Configuration for this data provider
   */
  constructor(
    private readonly collection: Collection,
    options: IMongoCollectionProviderOptions<TKey, TValue>
  ) {
    this.keyProperty = options.keyProperty;
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

        const age = record.modifiedDate.getMilliseconds();
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
    record.modifiedDate = new Date(value.age);

    let operation: Promise<UpdateWriteOpResult>;
    if (this.setMode == MongoCollectioonProviderSetMode.Replace) {
      operation = this.collection.replaceOne(
        { [this.keyProperty]: key },
        record,
        { upsert: true }
      );
    } else {
      operation = this.collection.updateOne(
        { [this.keyProperty]: key },
        record,
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
    const keyProperty = this.keyProperty;
    return this.collection
      .find<TValue>({})
      .map<TKey>(record => record[this.keyProperty] as TKey)
      .toArray();
  }

  /**
   * @returns The number of elements in this storage system
   */
  size(): Promise<number> {
    return this.collection.count();
  }
}
