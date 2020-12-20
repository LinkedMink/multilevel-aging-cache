/**
 *
 */
export declare enum MongoCollectioonProviderSetMode {
    Replace = 0,
    Update = 1
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
//# sourceMappingURL=IMongoCollectionProviderOptions.d.ts.map