"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.OverwriteAlwaysSetStrategy = void 0;
var AgingCacheWriteStrategy_1 = require("./AgingCacheWriteStrategy");
/**
 * Strategy to overwrite regardless of the higher level value
 */
var OverwriteAlwaysSetStrategy = /** @class */ (function (_super) {
    __extends(OverwriteAlwaysSetStrategy, _super);
    function OverwriteAlwaysSetStrategy() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    OverwriteAlwaysSetStrategy.prototype.set = function (key, value, force) {
        return this.executeSet(key, value);
    };
    return OverwriteAlwaysSetStrategy;
}(AgingCacheWriteStrategy_1.AgingCacheWriteStrategy));
exports.OverwriteAlwaysSetStrategy = OverwriteAlwaysSetStrategy;
//# sourceMappingURL=OverwriteAlwaysSetStrategy.js.map