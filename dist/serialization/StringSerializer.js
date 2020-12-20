"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringSerializer = void 0;
var serialize = function (data) {
    return data;
};
var deserialize = function (data) {
    return data;
};
/**
 * Simply here to satisfy the interface and make programming simpler
 */
var StringSerializer = /** @class */ (function () {
    function StringSerializer() {
        this.serialize = serialize;
        this.deserialize = deserialize;
    }
    return StringSerializer;
}());
exports.StringSerializer = StringSerializer;
//# sourceMappingURL=StringSerializer.js.map