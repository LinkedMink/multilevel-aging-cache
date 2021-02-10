import { ObjectId } from "mongodb";
import { ISerializer } from "@linkedmink/multilevel-aging-cache";

/**
 * De/Serialize ObjectId objects
 */
export class ObjectIdSerializer implements ISerializer<ObjectId> {
  serialize = (data: ObjectId): string => {
    return data.toHexString();
  };

  deserialize = (data: string): ObjectId => {
    return new ObjectId(data);
  };
}
