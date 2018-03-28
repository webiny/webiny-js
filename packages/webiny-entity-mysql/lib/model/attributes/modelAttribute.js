"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _webinyModel = require("webiny-model");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class ModelAttribute extends _webinyModel.ModelAttribute {
    setStorageValue(value) {
        return super.setStorageValue(JSON.parse(value));
    }

    getStorageValue() {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const value = yield _webinyModel.ModelAttribute.prototype.getStorageValue.call(_this);
            return value ? (0, _stringify2.default)(value) : value;
        })();
    }
}

exports.default = ModelAttribute;
//# sourceMappingURL=modelAttribute.js.map
