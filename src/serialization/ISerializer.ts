/**
 * @param data The data to convert
 * @return The input data as a string
 */
export type SerializeFunction<T> = (data: T) => string

/**
 * @param data The data to convert
 * @return The input data as an object
 */
export type DeserializeFunction<T> = (data: string) => T;

/**
 * Implement converting a data type from/to strings
 */
export interface ISerializer<T> {
  serialize: SerializeFunction<T>;
  deserialize: DeserializeFunction<T>;
}
