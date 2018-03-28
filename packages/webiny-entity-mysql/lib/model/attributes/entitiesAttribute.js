"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _webinyEntity = require("webiny-entity");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class EntitiesAttribute extends _webinyEntity.EntitiesAttribute {
    getStorageValue() {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            return (0,
            _stringify2.default)(yield _webinyEntity.EntitiesAttribute.prototype.getStorageValue.call(_this));
        })();
    }

    setStorageValue(value) {
        super.setStorageValue(JSON.parse(value));
        return this;
    }
}

exports.default = EntitiesAttribute;
//# sourceMappingURL=entitiesAttribute.js.map
