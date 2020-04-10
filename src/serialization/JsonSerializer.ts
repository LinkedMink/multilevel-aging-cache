import { ISerializer } from "./ISerializer";

const serialize = <T>(data: T): string => {
  return JSON.stringify(data);
};

const deserialize = <T>(data: string): T => {
  return JSON.parse(data);
}

/**
 * De/Serialize JSON objects with the native JSON.stringify and JSON.parse
 */
export class JsonSerializer<T extends {}> implements ISerializer<T> {
  serialize = serialize;
  deserialize = deserialize;
}
