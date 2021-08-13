import { ObjectId } from "mongodb";

const DEFAULT_KEY_PROPERTY = "_id";
const DEFAULT_AGE_PROPERTY = "modifiedDate";

/**
 * A MongoDB record that has fields to track when it's written.
 */
export interface IMongoRecord {
  _id?: ObjectId;
  [property: string]: unknown;
}

/**
 * When set() is called should the entire document be replaced or only the fields that are provided
 */
export enum MongoProviderSetMode {
  Replace,
  Update,
}

export type ToNumberFunc = <T>(age: T) => number;
export type ToTypeFunc = <T>(value: number) => T;

/**
 * Options to configure mongodb as a storage provider
 */
export interface IMongoProviderOptions<TKey, TValue extends IMongoRecord> {
  /**
   * When set() is called should the entire document be replaced or only the fields that are provided
   */
  setMode: MongoProviderSetMode;
  /**
   * The property (with . seperators for nested properties) to use as the search key on a document
   */
  keyProperty: string;
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
 * Default options to use mongodb _id ObjectID as the key and update as a write policy
 */
export function getDefaultOptions<TKey, TValue extends IMongoRecord>(): IMongoProviderOptions<
  TKey,
  TValue
> {
  return {
    setMode: MongoProviderSetMode.Update,
    keyProperty: DEFAULT_KEY_PROPERTY,
    ageProperty: DEFAULT_AGE_PROPERTY,
    ageToNumberFunc: ((age: Date) => age.getTime()) as ToNumberFunc,
    numberToAgeFunc: ((age: number) => new Date(age)) as ToTypeFunc,
  };
}
