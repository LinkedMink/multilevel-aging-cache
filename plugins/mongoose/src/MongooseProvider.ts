import { Document, EnforceDocument, Model, Query, Types } from 'mongoose';

import { IAgedValue, IStorageProvider, Logger } from '@linkedmink/multilevel-aging-cache';
import { IMongooseProviderOptions } from './IMongooseProviderOptions';
import {
  getDotSeperatedPropertyValue,
  isMongooseValidationError,
  setDotSeperatedPropertyValue,
} from './Helpers';

/**
 * Use mongodb as a persistent storage mechanism with Mongoose documents
 */
export class MongooseProvider<TKey = Types.ObjectId, TValue extends Document = Document>
  implements IStorageProvider<TKey, TValue>
{
  readonly isPersistable = true;

  private readonly logger = Logger.get(MongooseProvider.name);
  private readonly keyProperty = this.options.keyProperty ?? '_id';

  /**
   * @param model The object returned by 'mongoose'.model function
   * @param options Configuration for this data provider
   */
  constructor(
    private readonly model: Model<TValue>,
    private readonly options: IMongooseProviderOptions<TKey, TValue>
  ) {}

  /**
   * @param key The key to retrieve
   * @returns The value if retreiving was successful or null
   */
  async get(key: TKey): Promise<IAgedValue<TValue> | null> {
    const query = this.options.keyFunc
      ? this.model.findOne(this.options.keyFunc(key))
      : this.model.findById(key);

    const result = await this.execIgnoreError(query);

    return result !== null ? this.getAgedValue(result) : null;
  }

  /**
   * @param key The key to set
   * @param value The value to set
   * @returns The value written if successful or null
   */
  set(key: TKey, value: IAgedValue<TValue>): Promise<IAgedValue<TValue> | null> {
    this.updateRecordAge(value);

    return new Promise((resolve, _reject) => {
      value.value.save((error, doc) => {
        if (!error) {
          return resolve(this.getAgedValue(doc));
        }

        if (isMongooseValidationError(error)) {
          throw error;
        } else {
          this.logger.info({ message: error });
        }

        return resolve(null);
      });
    });
  }

  /**
   * @param key The key to the value to delete
   * @returns The value deleted or boolean (value | true is success). A provider
   * is not required to return a value
   */
  async delete(key: TKey): Promise<IAgedValue<TValue> | boolean> {
    const query = this.options.keyFunc
      ? this.model.findOneAndDelete(this.options.keyFunc(key))
      : this.model.findByIdAndDelete(key);

    const result = await this.execIgnoreError(query);

    return result !== null;
  }

  /**
   * @returns The keys that are currently available in the provider
   */
  async keys(): Promise<TKey[]> {
    const query = this.model.find().select(this.keyProperty);

    const result = await this.execIgnoreError(query);
    if (result === null) {
      return [] as TKey[];
    }

    return result.map(
      r =>
        getDotSeperatedPropertyValue(
          r as unknown as Record<string, unknown>,
          this.keyProperty
        ) as TKey
    );
  }

  /**
   * @returns The number of elements in this storage system
   */
  async size(): Promise<number> {
    const result = await this.execIgnoreError(this.model.countDocuments());
    return result === null ? 0 : result;
  }

  private updateRecordAge = (value: IAgedValue<TValue>) =>
    setDotSeperatedPropertyValue(
      value.value as Record<string, unknown>,
      this.options.ageProperty,
      this.options.numberToAgeFunc ? this.options.numberToAgeFunc(value.age) : value.age
    );

  private getAgedValue = (value: TValue) => {
    const ageValue = getDotSeperatedPropertyValue(
      value as Record<string, unknown>,
      this.options.ageProperty
    );
    const age = this.options.ageToNumberFunc
      ? this.options.ageToNumberFunc(ageValue)
      : (ageValue as number);

    return { age, value };
  };

  private execIgnoreError = <TResult>(
    query: Query<TResult | null, EnforceDocument<TValue, Record<string, never>>>
  ): Promise<TResult | null> =>
    query.exec().catch(e => {
      this.logger.verbose({ message: e as Error });
      return null;
    });
}
