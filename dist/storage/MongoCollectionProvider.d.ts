import { Collection, ObjectID } from "mongodb";
import { IStorageProvider } from "./IStorageProvider";
import { IAgedValue } from "../cache/expire/IAgedQueue";
import { IMongoCollectionProviderOptions } from "./IMongoCollectionProviderOptions";
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
export declare class MongoCollectionProvider<TKey, TValue extends IMongoCollectionRecord> implements IStorageProvider<TKey, TValue> {
    private readonly collection;
    private readonly setMode;
    private readonly keyProperty;
    /**
     * @param collection The collection from an active MongoClient connection with documents as values
     * @param options Configuration for this data provider
     */
    constructor(collection: Collection, options: IMongoCollectionProviderOptions<TKey, TValue>);
    /**
     * @param key The key to retrieve
     * @returns The value if retreiving was successful or null
     */
    get(key: TKey): Promise<IAgedValue<TValue> | null>;
    /**
     * @param key The key to set
     * @param value The value to set
     * @returns If setting the value was successful
     */
    set(key: TKey, value: IAgedValue<TValue>): Promise<boolean>;
    /**
     * @param key The key to the value to delete
     * @returns If deleting the value was successful
     */
    delete(key: TKey): Promise<boolean>;
    /**
     * @returns The keys that are currently available in the provider
     */
    keys(): Promise<TKey[]>;
    /**
     * @returns The number of elements in this storage system
     */
    size(): Promise<number>;
}
//# sourceMappingURL=MongoCollectionProvider.d.ts.map