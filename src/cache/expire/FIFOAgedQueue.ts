import { RBTree } from "bintrees";

import { compareAscending, IAgedQueue } from "./IAgedQueue";
import { Logger } from "../../shared/Logger";

export class FIFOAgedQueue<TKey> implements IAgedQueue<TKey> {
  private static readonly logger = Logger.get(FIFOAgedQueue.name);
  private readonly ageLimit: number;
  private readonly ageTree: RBTree<number> = new RBTree(compareAscending);
  private readonly ageMap = new Map<TKey, number>();
  private readonly ageBuckets = new Map<number, Set<TKey>>();

  /**
   * @param maxEntries The maximum number of entries to store in the cache, undefined for no max
   * @param ageLimit The maximum time to keep entries in minutes
   */
  constructor(private readonly maxEntries?: number, ageLimit = 200) {
    this.ageLimit = ageLimit * 1000 * 60;
  }

  /**
   * @param key The key to add
   * @param age The age if explicitly or default if undefined
   */
  addOrReplace(key: TKey, age?: number): void {
    const existingAge = this.ageMap.get(key);
    const newAge = age ? age : this.getInitialAge(key);
    this.ageMap.set(key, newAge);

    if (existingAge !== undefined) {
      this.deleteBucket(existingAge, key);
    }

    this.addBucket(newAge, key);
  }

  /**
   * @return The next key in order or null if there is no key
   */
  next(): TKey | null {
    const minAge = this.ageTree.min();
    const minBucket = this.ageBuckets.get(minAge);
    if (minBucket === undefined) {
      return null;
    }

    const iterator = minBucket.values().next();
    return iterator.value as TKey;
  }

  /**
   * @param key The key to delete
   */
  delete(key: TKey): void {
    const age = this.ageMap.get(key);
    if (age === undefined) {
      return;
    }

    this.ageMap.delete(key);
    this.deleteBucket(age, key);
  }

  /**
   * @return True if the next key in order is expired and should be removed
   */
  isNextExpired(): boolean {
    if (this.maxEntries && this.ageMap.size > this.maxEntries) {
      FIFOAgedQueue.logger.debug(`Max Entries Exceeded: ${this.maxEntries}`);
      return true;
    }

    const next = this.next();
    if (next === null) {
      return false;
    }

    const age = this.ageMap.get(next);
    if (age !== undefined && age + this.ageLimit < Date.now()) {
      FIFOAgedQueue.logger.debug(
        `Age Limit Exceeded: age=${age},limit=${this.ageLimit}`
      );
      return true;
    }

    return false;
  }

  /**
   * @param key The key we want a default for
   * @return The default age that will very by algorithm
   */
  getInitialAge(key: TKey): number {
    return Date.now();
  }

  /**
   * @param key Advance the age of the specified key
   */
  updateAge(key: TKey): void {
    const oldAge = this.ageMap.get(key);
    if (oldAge === undefined) {
      return;
    }

    const newAge = Date.now();
    this.ageMap.set(key, newAge);
    this.deleteBucket(oldAge, key);
    this.addBucket(newAge, key);
  }

  /**
   * @param ageA The first age to compare
   * @param ageB The second age to compare
   * @return 0 if same order, positive if ageA after ageB, negative if ageA before ageB
   */
  compare = compareAscending;

  /**
   * @return The number of keys in the queue
   */
  size(): number {
    return this.ageMap.size;
  }

  private addBucket(age: number, key: TKey): void {
    const bucket = this.ageBuckets.get(age);
    if (bucket === undefined) {
      this.ageBuckets.set(age, new Set([key]));
    } else {
      bucket.add(key);
    }

    const found = this.ageTree.find(age);
    if (found === null) {
      this.ageTree.insert(age);
    }
  }

  private deleteBucket(age: number, key: TKey): void {
    const bucket = this.ageBuckets.get(age);
    if (bucket === undefined) {
      return;
    }

    bucket.delete(key);
    if (bucket.size > 0) {
      return;
    }

    this.ageBuckets.delete(age);
    const found = this.ageTree.find(age);
    if (found !== null) {
      this.ageTree.remove(age);
    }
  }
}
