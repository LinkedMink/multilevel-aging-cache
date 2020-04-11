"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var serialize = function (data) {
    return JSON.stringify(data);
};
var deserialize = function (data) {
    return JSON.parse(data);
};
/**
 * De/Serialize JSON objects with the native JSON.stringify and JSON.parse
 */
var JsonSerializer = /** @class */ (function () {
    function JsonSerializer() {
        this.serialize = serialize;
        this.deserialize = deserialize;
    }
    return JsonSerializer;
}());
exports.JsonSerializer = JsonSerializer;
//# sourceMappingURL=JsonSerializer.js.map