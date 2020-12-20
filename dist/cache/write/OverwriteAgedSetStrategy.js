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
exports.OverwriteAgedSetStrategy = void 0;
var AgingCacheWriteStrategy_1 = require("./AgingCacheWriteStrategy");
/**
 * Strategy to overwrite only if our value is newer than the high level
 */
var OverwriteAgedSetStrategy = /** @class */ (function (_super) {
    __extends(OverwriteAgedSetStrategy, _super);
    function OverwriteAgedSetStrategy() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    OverwriteAgedSetStrategy.prototype.set = function (key, value, force) {
        var _this = this;
        if (force) {
            return this.executeSet(key, value);
        }
        var currentAge = this.evictQueue.getInitialAge(key);
        return this.hierarchy.getValueAtTopLevel(key).then(function (highestAgedValue) {
            if (!highestAgedValue ||
                _this.evictQueue.compare(highestAgedValue.age, currentAge) <= 0) {
                return _this.executeSet(key, value);
            }
            AgingCacheWriteStrategy_1.AgingCacheWriteStrategy.logger.debug("Set deferred: key=" + key + ",ageToSet=" + currentAge + ",ageFound=" + highestAgedValue.age);
            return _this.setFromHighestLevel(key, highestAgedValue);
        });
    };
    return OverwriteAgedSetStrategy;
}(AgingCacheWriteStrategy_1.AgingCacheWriteStrategy));
exports.OverwriteAgedSetStrategy = OverwriteAgedSetStrategy;
//# sourceMappingURL=OverwriteAgedSetStrategy.js.map