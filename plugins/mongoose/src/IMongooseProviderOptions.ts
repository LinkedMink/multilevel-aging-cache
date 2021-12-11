import { Document, FilterQuery, Types } from 'mongoose';

const DEFAULT_AGE_PROPERTY = 'modifiedDate';

export type ToNumberFunc = <T>(age: T) => number;
export type ToTypeFunc = <T>(value: number) => T;

export type FilterQueryFunc<TKey, TValue extends Document> = (key: TKey) => FilterQuery<TValue>;

/**
 * Options to configure Mongoose (mongodb) as a storage provider
 */
export interface IMongooseProviderOptions<
  TKey = Types.ObjectId,
  TValue extends Document = Document
> {
  /**
   * A function that returns a query to the search key
   */
  keyFunc?: FilterQueryFunc<TKey, TValue>;
  /**
   * The property (with . seperators for nested properties) to use as the search key on a document
   */
  keyProperty?: string;
  /**
   * The property (with . seperators for nested properties) that stores when the the document was last modified
   */
  ageProperty: string;
  /**
   * Convert the ageProperty to a numeric age. Set undefined if already a number
   */
  ageToNumberFunc?: ToNumberFunc;
  /**
   * Convert the numeric age to the ageProperty type. Set undefined if already a number
   */
  numberToAgeFunc?: ToTypeFunc;
}

/**
 * Default options to use Mongoosedb _id ObjectID as the key and update as a write policy
 */
export function getDefaultOptions<TValue extends Document = Document>(): IMongooseProviderOptions<
  Types.ObjectId,
  TValue
> {
  return {
    ageProperty: DEFAULT_AGE_PROPERTY,
    ageToNumberFunc: ((age: Date) => age.getTime()) as ToNumberFunc,
    numberToAgeFunc: ((age: number) => new Date(age)) as ToTypeFunc,
  };
}
