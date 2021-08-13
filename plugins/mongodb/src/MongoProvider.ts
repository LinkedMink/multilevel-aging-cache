import { Collection, Document, UpdateResult } from "mongodb";

import { IAgedValue, IStorageProvider } from "@linkedmink/multilevel-aging-cache";
import { IMongoProviderOptions, IMongoRecord, MongoProviderSetMode } from "./IMongoProviderOptions";
import { getDotSeperatedPropertyValue, setDotSeperatedPropertyValue } from "./Helpers";

const isUpdateResult = (value: unknown): value is UpdateResult =>
  (value as UpdateResult).modifiedCount !== undefined;

/**
 * Use mongodb as a persistent storage mechanism
 */
export class MongoProvider<TKey, TValue extends IMongoRecord>
  implements IStorageProvider<TKey, TValue>
{
  readonly isPersistable = true;

  /**
   * @param collection The collection from an active MongoClient connection with documents as values
   * @param options Configuration for this data provider
   */
  constructor(
    private readonly collection: Collection,
    private readonly options: IMongoProviderOptions<TKey, TValue>
  ) {}

  /**
   * @param key The key to retrieve
   * @returns The value if retreiving was successful or null
   */
  get(key: TKey): Promise<IAgedValue<TValue> | null> {
    return this.collection
      .findOne<IMongoRecord>({ [this.options.keyProperty]: key }, {})
      .then(record => {
        if (!record) {
          return null;
        }

        const ageValue = getDotSeperatedPropertyValue(record, this.options.ageProperty);
        const age = this.options.ageToNumberFunc
          ? this.options.ageToNumberFunc(ageValue)
          : (ageValue as number);
        return {
          age,
          value: record as TValue,
        };
      });
  }

  /**
   * @param key The key to set
   * @param value The value to set
   * @returns The value written if successful or null
   */
  set(key: TKey, value: IAgedValue<TValue>): Promise<IAgedValue<TValue> | null> {
    const record = value.value;
    setDotSeperatedPropertyValue(
      record,
      this.options.ageProperty,
      this.options.numberToAgeFunc ? this.options.numberToAgeFunc(value.age) : value.age
    );

    let operation: Promise<Document | UpdateResult>;
    if (this.options.setMode == MongoProviderSetMode.Replace) {
      operation = this.collection.replaceOne(
        { [this.options.keyProperty]: key },
        { $set: record },
        { upsert: true }
      );
    } else {
      operation = this.collection.updateOne(
        { [this.options.keyProperty]: key },
        { $set: record },
        { upsert: true }
      );
    }

    return operation.then(status =>
      isUpdateResult(status) ? (status.modifiedCount > 0 ? value : null) : value
    );
  }

  /**
   * @param key The key to the value to delete
   * @returns The value deleted or boolean (value | true is success). A provider
   * is not required to return a value
   */
  delete(key: TKey): Promise<IAgedValue<TValue> | boolean> {
    return this.collection.deleteOne({ [this.options.keyProperty]: key }).then(status => {
      return status.deletedCount !== undefined && status.deletedCount > 0;
    });
  }

  /**
   * @returns The keys that are currently available in the provider
   */
  keys(): Promise<TKey[]> {
    return this.collection
      .find<TValue>({}, { [this.options.keyProperty]: 1 })
      .map<TKey>(record => getDotSeperatedPropertyValue(record, this.options.keyProperty) as TKey)
      .toArray();
  }

  /**
   * @returns The number of elements in this storage system
   */
  size(): Promise<number> {
    return this.collection.countDocuments();
  }
}
