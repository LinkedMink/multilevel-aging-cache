import { EventEmitter } from "events";
import { Document, Model, Query, Types } from "mongoose";

import {
  IAgedValue,
  IStorageProvider,
  Logger,
} from "@linkedmink/multilevel-aging-cache";
import { IMongooseCollectionProviderOptions } from "./IMongooseProviderOptions";
import { getDotSeperatedPropertyValue, isMongooseValidationError, setDotSeperatedPropertyValue } from "./Helpers";

export enum MongooseCollectionProviderEvent {
  ValidationError = 'MongooseValidationError',
  DocumentUpdated = "MongooseDocumentUpdated",
  DocumentCreated = "MongooseDocumentCreated"
}

/**
 * Use mongodb as a persistent storage mechanism with Mongoose validation
 */
export class MongooseCollectionProvider<
  TKey = Types.ObjectId,
  TValue extends Document = Document
> extends EventEmitter implements IStorageProvider<TKey, TValue> {
  readonly isPersistable = true;

  private readonly logger = Logger.get(MongooseCollectionProvider.name);
  private readonly keyProperty = this.options.keyProperty ?? '_id';

  /**
   * @param model
   * @param options Configuration for this data provider
   */
  constructor(
    private readonly model: Model<TValue>,
    private readonly options: IMongooseCollectionProviderOptions<TKey, TValue>
  ) {
    super()
  }

  /**
   * @param key The key to retrieve
   * @returns The value if retreiving was successful or null
   */
  async get(key: TKey): Promise<IAgedValue<TValue> | null> {
    const query = this.options.keyFunc
      ? this.model.findOne(this.options.keyFunc(key))
      : this.model.findById(key);
    
    const result = await this.execIgnoreError(query)
    
    return result !== null 
      ? this.getAgedValue(result)
      : null
  }

  /**
   * @param key The key to set
   * @param value The value to set
   * @returns If setting the value was successful
   */
  set(key: TKey, value: IAgedValue<TValue>): Promise<boolean> {
    this.updateRecordAge(value);
    const isNewDoc = value.value.isNew;

    return new Promise((resolve, reject) => {
      value.value.save((error, doc) => {
        if (!error) {
          isNewDoc 
            ? this.emit(MongooseCollectionProviderEvent.DocumentCreated, key, doc)
            : this.emit(MongooseCollectionProviderEvent.DocumentUpdated, key, doc);
          return resolve(true);
        }

        if (isMongooseValidationError(error)) {
          this.logger.debug({ message: error });
          this.emit(MongooseCollectionProviderEvent.ValidationError, key, value, error.errors);
        } else {
          this.logger.verbose({ message: error });
        }

        return resolve(false);
      });
    })
  }

  /**
   * @param key The key to the value to delete
   * @returns If deleting the value was successful
   */
  async delete(key: TKey): Promise<boolean> {
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

    return result.map(r => getDotSeperatedPropertyValue(r as Record<string, unknown>, this.keyProperty) as TKey)
  }

  /**
   * @returns The number of elements in this storage system
   */
  async size(): Promise<number> {
    const result = await this.execIgnoreError(this.model.countDocuments())
    return result === null ? 0 : result;
  }

  private updateRecordAge = (value: IAgedValue<TValue>) => setDotSeperatedPropertyValue(
    value.value as Record<string, unknown>,
    this.options.ageProperty,
    this.options.numberToAgeFunc
      ? this.options.numberToAgeFunc(value.age)
      : value.age
  );

  private getAgedValue = (value: TValue) => {
    const ageValue = getDotSeperatedPropertyValue(
      value as Record<string, unknown>,
      this.options.ageProperty
    );
    const age = this.options.ageToNumberFunc
      ? this.options.ageToNumberFunc(ageValue)
      : ageValue as number;

    return { age, value };
  }

  private execIgnoreError = <TResult>(
    query: Query<TResult | null, TValue>
  ): Promise<TResult | null> => query.exec().catch(e => { 
    this.logger.verbose({ message: e as Error });
    return null;
  })
}
