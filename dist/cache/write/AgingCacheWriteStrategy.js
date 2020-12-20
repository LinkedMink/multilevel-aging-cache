"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgingCacheWriteStrategy = void 0;
var Logger_1 = require("../../shared/Logger");
var IAgingCache_1 = require("../IAgingCache");
/**
 * Keep common methods and data for each set/delete strategy here
 */
var AgingCacheWriteStrategy = /** @class */ (function () {
    /**
     * @param hierarchy The storage hierarchy to operate on
     * @param evictQueue The keys in the order to evict
     */
    function AgingCacheWriteStrategy(hierarchy, evictQueue) {
        var _this = this;
        this.hierarchy = hierarchy;
        this.evictQueue = evictQueue;
        this.executeDelete = function (key) {
            return _this.hierarchy.deleteAtLevel(key).then(function (status) {
                if (status === IAgingCache_1.AgingCacheWriteStatus.Success) {
                    _this.evictQueue.delete(key);
                }
                return status;
            });
        };
        this.executeSet = function (key, value) {
            var agedValue = {
                age: _this.evictQueue.getInitialAge(key),
                value: value,
            };
            return _this.hierarchy.setAtLevel(key, agedValue).then(function (status) {
                if (status === IAgingCache_1.AgingCacheWriteStatus.Success) {
                    _this.evictQueue.addOrReplace(key, agedValue.age);
                }
                return status;
            });
        };
        this.setFromHighestLevel = function (key, agedValue) {
            return _this.hierarchy.setBelowTopLevel(key, agedValue).then(function (status) {
                if (status === IAgingCache_1.AgingCacheWriteStatus.Success) {
                    _this.evictQueue.addOrReplace(key, agedValue.age);
                    return Promise.resolve(IAgingCache_1.AgingCacheWriteStatus.Refreshed);
                }
                return Promise.resolve(IAgingCache_1.AgingCacheWriteStatus.RefreshedError);
            });
        };
    }
    AgingCacheWriteStrategy.logger = Logger_1.Logger.get("AgingCacheWriteStrategy");
    return AgingCacheWriteStrategy;
}());
exports.AgingCacheWriteStrategy = AgingCacheWriteStrategy;
//# sourceMappingURL=AgingCacheWriteStrategy.js.map