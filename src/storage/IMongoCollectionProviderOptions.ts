import { ObjectID } from "mongodb";

const DEFAULT_KEY_PROPERTY = "_id";
const DEFAULT_MODIFIED_DATE_PROPERTY = "modifiedDate";

/**
 * A MongoDB record that has fields to track when it's written.
 */
export interface IMongoCollectionRecord {
  _id?: ObjectID;
  [property: string]: unknown;
}

/**
 * When set() is called should the entire document be replaced or only the fields that are provided
 */
export enum MongoCollectionProviderSetMode {
  Replace,
  Update,
}

/**
 * Options to configure mongodb as a storage provider
 */
export interface IMongoCollectionProviderOptions<
  TKey,
  TValue extends IMongoCollectionRecord
> {
  /**
   * When set() is called should the entire document be replaced or only the fields that are provided
   */
  setMode: MongoCollectionProviderSetMode;
  /**
   * The property (with . seperators for nested properties) to use as the search key on a document
   */
  keyProperty: string;
  /**
   * The property (with . seperators for nested properties) that stores when the the document was last modified
   */
  modifiedDateProperty: string;
}

/**
 * Default options to use mongodb _id ObjectID as the key and update as a write policy
 */
export function getDefaultOptions<
  TKey,
  TValue extends IMongoCollectionRecord
>(): IMongoCollectionProviderOptions<TKey, TValue> {
  return {
    setMode: MongoCollectionProviderSetMode.Update,
    keyProperty: DEFAULT_KEY_PROPERTY,
    modifiedDateProperty: DEFAULT_MODIFIED_DATE_PROPERTY,
  };
}
