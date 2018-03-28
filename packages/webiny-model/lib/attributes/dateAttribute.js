"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _attribute = require("./../attribute");

var _attribute2 = _interopRequireDefault(_attribute);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class DateAttribute extends _attribute2.default {
    validateType(value) {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            !_lodash2.default.isDate(value) && _this.expected("Date object", typeof value);
        })();
    }

    setValue(value) {
        if (typeof value === "number" || typeof value === "string") {
            this.value.setCurrent(new Date(value));
        } else {
            this.value.setCurrent(value);
        }
    }
}

exports.default = DateAttribute;
//# sourceMappingURL=dateAttribute.js.map
