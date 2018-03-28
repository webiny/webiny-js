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

class CharAttribute extends _attribute2.default {
    validateType(value) {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            !_lodash2.default.isString(value) && _this.expected("string", typeof value);
        })();
    }
}

exports.default = CharAttribute;
//# sourceMappingURL=charAttribute.js.map
