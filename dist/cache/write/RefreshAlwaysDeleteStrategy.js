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
 * Strategy to overwrite only if we're forced to
 */
var RefreshAlwaysDeleteStrategy = /** @class */ (function (_super) {
    __extends(RefreshAlwaysDeleteStrategy, _super);
    function RefreshAlwaysDeleteStrategy() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RefreshAlwaysDeleteStrategy.prototype.delete = function (key, force) {
        var _this = this;
        if (force) {
            return this.executeDelete(key);
        }
        return this.hierarchy.getValueAtTopLevel(key)
            .then(function (highestAgedValue) {
            if (!highestAgedValue) {
                return _this.executeDelete(key);
            }
            return _this.hierarchy.getValueAtBottomLevel(key)
                .then(function (lowestAgedValue) {
                if (lowestAgedValue && _this.evictQueue.compare(lowestAgedValue.age, highestAgedValue.age) === 0) {
                    return _this.executeDelete(key);
                }
                AgingCacheWriteStrategy_1.AgingCacheWriteStrategy.logger.debug("Delete deferred: key=" + key + ",ageToSet=" + (lowestAgedValue ? lowestAgedValue.age : 'null') + ",ageFound=" + highestAgedValue.age);
                return _this.setFromHighestLevel(key, highestAgedValue);
            });
        });
    };
    return RefreshAlwaysDeleteStrategy;
}(AgingCacheWriteStrategy_1.AgingCacheWriteStrategy));
exports.RefreshAlwaysDeleteStrategy = RefreshAlwaysDeleteStrategy;
//# sourceMappingURL=RefreshAlwaysDeleteStrategy.js.map