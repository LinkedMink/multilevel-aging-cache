import { IAgedQueue } from "./IAgedQueue";
export declare class FIFOAgedQueue<TKey> implements IAgedQueue<TKey> {
    private readonly maxEntries?;
    private static readonly logger;
    private readonly ageLimit;
    private readonly ageTree;
    private readonly ageMap;
    private readonly ageBuckets;
    /**
     * @param maxEntries The maximum number of entries to store in the cache, undefined for no max
     * @param ageLimit The maximum time to keep entries in minutes
     */
    constructor(maxEntries?: number | undefined, ageLimit?: number);
    /**
     * @param key The key to add
     * @param age The age if explicitly or default if undefined
     */
    addOrReplace(key: TKey, age?: number): void;
    /**
     * @return The next key in order or null if there is no key
     */
    next(): TKey | null;
    /**
     * @param key The key to delete
     */
    delete(key: TKey): void;
    /**
     * @return True if the next key in order is expired and should be removed
     */
    isNextExpired(): boolean;
    /**
     * @param key The key we want a default for
     * @return The default age that will very by algorithm
     */
    getInitialAge(key: TKey): number;
    /**
     * @param key Advance the age of the specified key
     */
    updateAge(key: TKey): void;
    /**
     * @param ageA The first age to compare
     * @param ageB The second age to compare
     * @return 0 if same order, positive if ageA after ageB, negative if ageA before ageB
     */
    compare: (ageA: number, ageB: number) => number;
    /**
     * @return The number of keys in the queue
     */
    size(): number;
    private addBucket;
    private deleteBucket;
}
//# sourceMappingURL=FIFOAgedQueue.d.ts.map