"use strict";
var __extends =
    (this && this.__extends) ||
    (function () {
        var extendStatics = function (d, b) {
            extendStatics =
                Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array &&
                    function (d, b) {
                        d.__proto__ = b;
                    }) ||
                function (d, b) {
                    for (var p in b) {
                        if (b.hasOwnProperty(p)) {
                            d[p] = b[p];
                        }
                    }
                };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() {
                this.constructor = d;
            }
            d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
        };
    })();
var __read =
    (this && this.__read) ||
    function (o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) {
            return o;
        }
        var i = m.call(o),
            r,
            ar = [],
            e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) {
                ar.push(r.value);
            }
        } catch (error) {
            e = { error: error };
        } finally {
            try {
                if (r && !r.done && (m = i["return"])) {
                    m.call(i);
                }
            } finally {
                if (e) {
                    throw e.error;
                }
            }
        }
        return ar;
    };
var __spread =
    (this && this.__spread) ||
    function () {
        for (var ar = [], i = 0; i < arguments.length; i++) {
            ar = ar.concat(__read(arguments[i]));
        }
        return ar;
    };
Object.defineProperty(exports, "__esModule", { value: true });
var EventEmitter = /** @class */ (function () {
    function EventEmitter() {
        this.events_ = {};
    }
    EventEmitter.prototype.on = function (event, cb) {
        this.events_ = this.events_ || {};
        this.events_[event] = this.events_[event] || [];
        this.events_[event].push(cb);
    };
    EventEmitter.prototype.off = function (event, cb) {
        this.events_ = this.events_ || {};
        if (event in this.events_ === false) {
            return;
        }
        this.events_[event].splice(this.events_[event].indexOf(cb), 1);
    };
    EventEmitter.prototype.trigger = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        this.events_ = this.events_ || {};
        if (event in this.events_ === false) {
            return;
        }
        for (var i = 0; i < this.events_[event].length; i++) {
            this.events_[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
        }
    };
    return EventEmitter;
})();
exports.EventEmitter = EventEmitter;
var ArrayEmitter = /** @class */ (function (_super) {
    __extends(ArrayEmitter, _super);
    function ArrayEmitter() {
        var _this = (_super !== null && _super.apply(this, arguments)) || this;
        _this.array = [];
        return _this;
    }
    ArrayEmitter.prototype.push = function () {
        var _a;
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        var rVal = (_a = this.array).push.apply(_a, __spread(items));
        this.trigger("change");
        return rVal;
    };
    return ArrayEmitter;
})(EventEmitter);
exports.ArrayEmitter = ArrayEmitter;
