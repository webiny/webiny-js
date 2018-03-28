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

class ModelsAttribute extends _webinyModel.ModelsAttribute {
    setStorageValue(value) {
        this.setValue(JSON.parse(value));
        return this;
    }

    getStorageValue() {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            return (0,
            _stringify2.default)(yield _webinyModel.ModelsAttribute.prototype.getStorageValue.call(_this));
        })();
    }
}
exports.default = ModelsAttribute;
//# sourceMappingURL=modelsAttribute.js.map
