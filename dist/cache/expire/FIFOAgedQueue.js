"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FIFOAgedQueue = void 0;
var bintrees_1 = require("bintrees");
var Logger_1 = require("../../shared/Logger");
var compare = function (ageA, ageB) {
    return ageA - ageB;
};
var FIFOAgedQueue = /** @class */ (function () {
    /**
     * @param maxEntries The maximum number of entries to store in the cache, undefined for no max
     * @param ageLimit The maximum time to keep entries in minutes
     */
    function FIFOAgedQueue(maxEntries, ageLimit) {
        if (ageLimit === void 0) { ageLimit = 200; }
        this.maxEntries = maxEntries;
        this.ageTree = new bintrees_1.RBTree(compare);
        this.ageMap = new Map();
        this.ageBuckets = new Map();
        /**
         * @param ageA The first age to compare
         * @param ageB The second age to compare
         * @return 0 if same order, positive if ageA after ageB, negative if ageA before ageB
         */
        this.compare = compare;
        this.ageLimit = ageLimit * 1000 * 60;
    }
    /**
     * @param key The key to add
     * @param age The age if explicitly or default if undefined
     */
    FIFOAgedQueue.prototype.addOrReplace = function (key, age) {
        var existingAge = this.ageMap.get(key);
        var newAge = age ? age : this.getInitialAge(key);
        this.ageMap.set(key, newAge);
        if (existingAge !== undefined) {
            this.deleteBucket(existingAge, key);
        }
        this.addBucket(newAge, key);
    };
    /**
     * @return The next key in order or null if there is no key
     */
    FIFOAgedQueue.prototype.next = function () {
        var minAge = this.ageTree.min();
        var minBucket = this.ageBuckets.get(minAge);
        if (minBucket === undefined) {
            return null;
        }
        var iterator = minBucket.values().next();
        return iterator.value;
    };
    /**
     * @param key The key to delete
     */
    FIFOAgedQueue.prototype.delete = function (key) {
        var age = this.ageMap.get(key);
        if (age === undefined) {
            return;
        }
        this.ageMap.delete(key);
        this.deleteBucket(age, key);
    };
    /**
     * @return True if the next key in order is expired and should be removed
     */
    FIFOAgedQueue.prototype.isNextExpired = function () {
        if (this.maxEntries && this.ageMap.size > this.maxEntries) {
            FIFOAgedQueue.logger.debug("Max Entries Exceeded: " + this.maxEntries);
            return true;
        }
        var next = this.next();
        if (next === null) {
            return false;
        }
        var age = this.ageMap.get(next);
        if (age !== undefined && age + this.ageLimit < Date.now()) {
            FIFOAgedQueue.logger.debug("Age Limit Exceeded: age=" + age + ",limit=" + this.ageLimit);
            return true;
        }
        return false;
    };
    /**
     * @param key The key we want a default for
     * @return The default age that will very by algorithm
     */
    FIFOAgedQueue.prototype.getInitialAge = function (key) {
        return Date.now();
    };
    /**
     * @param key Advance the age of the specified key
     */
    FIFOAgedQueue.prototype.updateAge = function (key) {
        var oldAge = this.ageMap.get(key);
        if (oldAge === undefined) {
            return;
        }
        var newAge = Date.now();
        this.ageMap.set(key, newAge);
        this.deleteBucket(oldAge, key);
        this.addBucket(newAge, key);
    };
    /**
     * @return The number of keys in the queue
     */
    FIFOAgedQueue.prototype.size = function () {
        return this.ageMap.size;
    };
    FIFOAgedQueue.prototype.addBucket = function (age, key) {
        var bucket = this.ageBuckets.get(age);
        if (bucket === undefined) {
            this.ageBuckets.set(age, new Set([key]));
        }
        else {
            bucket.add(key);
        }
        var found = this.ageTree.find(age);
        if (found === null) {
            this.ageTree.insert(age);
        }
    };
    FIFOAgedQueue.prototype.deleteBucket = function (age, key) {
        var bucket = this.ageBuckets.get(age);
        if (bucket === undefined) {
            return;
        }
        bucket.delete(key);
        if (bucket.size > 0) {
            return;
        }
        this.ageBuckets.delete(age);
        var found = this.ageTree.find(age);
        if (found !== null) {
            this.ageTree.remove(age);
        }
    };
    FIFOAgedQueue.logger = Logger_1.Logger.get(FIFOAgedQueue.name);
    return FIFOAgedQueue;
}());
exports.FIFOAgedQueue = FIFOAgedQueue;
//# sourceMappingURL=FIFOAgedQueue.js.map