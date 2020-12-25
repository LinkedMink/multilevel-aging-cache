import { ISerializer } from "./ISerializer";

const serialize = <T>(data: T): string => {
  return JSON.stringify(data);
};

const deserialize = <T>(data: string): T => {
  return JSON.parse(data) as T;
};

/**
 * De/Serialize JSON objects with the native JSON.stringify and JSON.parse
 */
export class JsonSerializer<T extends Record<string, unknown> | Array<unknown>>
  implements ISerializer<T> {
  serialize = serialize;
  deserialize = deserialize;
}
