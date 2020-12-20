"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoCollectionProvider = void 0;
var IMongoCollectionProviderOptions_1 = require("./IMongoCollectionProviderOptions");
/**
 *
 */
var MongoCollectionProvider = /** @class */ (function () {
    /**
     * @param collection The collection from an active MongoClient connection with documents as values
     * @param options Configuration for this data provider
     */
    function MongoCollectionProvider(collection, options) {
        this.collection = collection;
        this.keyProperty = options.keyProperty;
        this.setMode = options.setMode;
    }
    /**
     * @param key The key to retrieve
     * @returns The value if retreiving was successful or null
     */
    MongoCollectionProvider.prototype.get = function (key) {
        var _a;
        return this.collection
            .findOne((_a = {}, _a[this.keyProperty] = key, _a))
            .then(function (record) {
            if (!record) {
                return null;
            }
            var age = record.modifiedDate.getMilliseconds();
            return {
                age: age,
                value: record,
            };
        });
    };
    /**
     * @param key The key to set
     * @param value The value to set
     * @returns If setting the value was successful
     */
    MongoCollectionProvider.prototype.set = function (key, value) {
        var _a, _b;
        var record = value.value;
        record.modifiedDate = new Date(value.age);
        var operation;
        if (this.setMode == IMongoCollectionProviderOptions_1.MongoCollectioonProviderSetMode.Replace) {
            operation = this.collection.replaceOne((_a = {}, _a[this.keyProperty] = key, _a), record, { upsert: true });
        }
        else {
            operation = this.collection.updateOne((_b = {}, _b[this.keyProperty] = key, _b), record, { upsert: true });
        }
        return operation.then(function (status) { return status.modifiedCount > 0; });
    };
    /**
     * @param key The key to the value to delete
     * @returns If deleting the value was successful
     */
    MongoCollectionProvider.prototype.delete = function (key) {
        var _a;
        return this.collection
            .deleteOne((_a = {}, _a[this.keyProperty] = key, _a))
            .then(function (status) {
            return status.deletedCount !== undefined && status.deletedCount > 0;
        });
    };
    /**
     * @returns The keys that are currently available in the provider
     */
    MongoCollectionProvider.prototype.keys = function () {
        var _this = this;
        var keyProperty = this.keyProperty;
        return this.collection
            .find({})
            .map(function (record) { return record[_this.keyProperty]; })
            .toArray();
    };
    /**
     * @returns The number of elements in this storage system
     */
    MongoCollectionProvider.prototype.size = function () {
        return this.collection.count();
    };
    return MongoCollectionProvider;
}());
exports.MongoCollectionProvider = MongoCollectionProvider;
//# sourceMappingURL=MongoCollectionProvider.js.map