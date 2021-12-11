import { Document, Model } from 'mongoose';
import { ISerializer } from '@linkedmink/multilevel-aging-cache';

/**
 * De/Serialize Mongoose objects
 */
export class MongooseSerializer<T extends Document> implements ISerializer<T> {
  constructor(private readonly model: Model<T>) {}

  serialize = (data: T): string => {
    return JSON.stringify(data.toJSON());
  };

  deserialize = (data: string): T => {
    const dataObject = JSON.parse(data) as T;
    return new this.model(dataObject);
  };
}
