import { ISerializer } from "./ISerializer";
/**
 * De/Serialize JSON objects with the native JSON.stringify and JSON.parse
 */
export declare class JsonSerializer<T extends {}> implements ISerializer<T> {
    serialize: <T_1>(data: T_1) => string;
    deserialize: <T_1>(data: string) => T_1;
}
//# sourceMappingURL=JsonSerializer.d.ts.map