/**
 * 
 */
export enum MongoCollectioonProviderSetMode {
  Replace,
  Update
}

/**
 * 
 */
export interface IMongoCollectionProviderOptions<TKey, TValue> {
  /**
   * 
   */
  setMode: MongoCollectioonProviderSetMode;
  /**
   * 
   */
  keyProperty: string;
}
