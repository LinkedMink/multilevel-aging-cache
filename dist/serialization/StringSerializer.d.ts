import { ISerializer } from "./ISerializer";
/**
 * Simply here to satisfy the interface and make programming simpler
 */
export declare class StringSerializer implements ISerializer<string> {
    serialize: (data: string) => string;
    deserialize: (data: string) => string;
}
//# sourceMappingURL=StringSerializer.d.ts.map