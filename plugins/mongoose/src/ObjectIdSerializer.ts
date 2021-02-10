import { Types } from "mongoose";
import { ISerializer } from "@linkedmink/multilevel-aging-cache";

/**
 * De/Serialize ObjectId objects
 */
export class ObjectIdSerializer implements ISerializer<Types.ObjectId> {
  serialize = (data: Types.ObjectId): string => {
    return data.toHexString();
  };

  deserialize = (data: string): Types.ObjectId => {
    return new Types.ObjectId(data);
  };
}
