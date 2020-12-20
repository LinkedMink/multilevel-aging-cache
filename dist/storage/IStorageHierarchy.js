"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageHierarchyUpdatePolicy = void 0;
/**
 * When an update arrives from a higher level cache, how should we update lower level caches?
 */
var StorageHierarchyUpdatePolicy;
(function (StorageHierarchyUpdatePolicy) {
    /**
     * Only update lower level storage if the key currently resides in them. The next get on the key
     * will be forced to retrieve from the higher level, so this maintains consistency while not requiring
     * extra storage (at the cost of performance).
     */
    StorageHierarchyUpdatePolicy[StorageHierarchyUpdatePolicy["OnlyIfKeyExist"] = 0] = "OnlyIfKeyExist";
    /**
     * Set the key/value in our lower level storage unconditionally. This might be important for permenant
     * storage hierarchies or higher read performance (at the cost of write performance and space).
     */
    StorageHierarchyUpdatePolicy[StorageHierarchyUpdatePolicy["Always"] = 1] = "Always";
})(StorageHierarchyUpdatePolicy = exports.StorageHierarchyUpdatePolicy || (exports.StorageHierarchyUpdatePolicy = {}));
//# sourceMappingURL=IStorageHierarchy.js.map