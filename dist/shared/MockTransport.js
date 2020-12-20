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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var winston_transport_1 = __importDefault(require("winston-transport"));
var MockTransport = /** @class */ (function (_super) {
    __extends(MockTransport, _super);
    function MockTransport(opts) {
        var _this = _super.call(this, opts) || this;
        _this.callsValue = [];
        return _this;
    }
    Object.defineProperty(MockTransport.prototype, "calls", {
        get: function () {
            return this.callsValue;
        },
        enumerable: false,
        configurable: true
    });
    MockTransport.prototype.reset = function () {
        this.callsValue = [];
    };
    MockTransport.prototype.log = function (info, next) {
        this.callsValue.push(info);
        next();
    };
    return MockTransport;
}(winston_transport_1.default));
exports.default = MockTransport;
;
//# sourceMappingURL=MockTransport.js.map