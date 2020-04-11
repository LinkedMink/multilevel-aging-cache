"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var AgingCacheWriteStrategy_1 = require("./AgingCacheWriteStrategy");
/**
 * Strategy to overwrite regardless of the higher level value
 */
var OverwriteAlwaysDeleteStrategy = /** @class */ (function (_super) {
    __extends(OverwriteAlwaysDeleteStrategy, _super);
    function OverwriteAlwaysDeleteStrategy() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    OverwriteAlwaysDeleteStrategy.prototype.delete = function (key, force) {
        return this.executeDelete(key);
    };
    return OverwriteAlwaysDeleteStrategy;
}(AgingCacheWriteStrategy_1.AgingCacheWriteStrategy));
exports.OverwriteAlwaysDeleteStrategy = OverwriteAlwaysDeleteStrategy;
//# sourceMappingURL=OverwriteAlwaysDeleteStrategy.js.map