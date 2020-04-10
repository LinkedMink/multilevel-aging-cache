import { ISerializer } from "./ISerializer";

const serialize = (data: string): string => {
  return data;
};

const deserialize = (data: string): string => {
  return data;
}

/**
 * Simply here to satisfy the interface and make programming simpler
 */
export class StringSerializer implements ISerializer<string> {
  serialize = serialize;
  deserialize = deserialize;
}
