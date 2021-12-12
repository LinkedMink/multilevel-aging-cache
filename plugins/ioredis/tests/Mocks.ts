import { ISerializer } from '@linkedmink/multilevel-aging-cache';

export class MockSerializer implements ISerializer<string> {
  static testSerializePrefix = 'TEST12345_';
  serialize = jest.fn((data: string) => MockSerializer.testSerializePrefix + data);
  deserialize = jest.fn((data: string) =>
    data.substring(MockSerializer.testSerializePrefix.length)
  );
}
