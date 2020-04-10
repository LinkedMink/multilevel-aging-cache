/**
 * Age bits that will very by replacement algorithm
 */
export interface IAged {
  age: number;
}

/**
 * A value with age bits that will very by replacement algorithm
 */
export interface IAgedValue<TValue> extends IAged {
  value: TValue;
}

/**
 * A data structure for selecting elements to expire in order
 */
export interface IAgedQueue<TKey> {
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
  compare(ageA: number, ageB: number): number;

  /**
   * @return The number of keys in the queue
   */
  size(): number;
}
