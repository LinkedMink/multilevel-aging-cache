import { IMongoCollectionRecord } from "./MongoCollectionProvider";

const DEFAULT_KEY_PROPERTY = "_id";

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
   * The property to use as the search key on a document
   */
  keyProperty: string;
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
  };
}
