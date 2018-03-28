"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _webinyModel = require("webiny-model");

var _fecha = require("fecha");

var _fecha2 = _interopRequireDefault(_fecha);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class DateAttribute extends _webinyModel.DateAttribute {
    setStorageValue(value) {
        if (value === null) {
            return super.setValue(value);
        }

        if (value instanceof Date) {
            return super.setStorageValue(value);
        }

        return super.setStorageValue(_fecha2.default.parse(value, "YYYY-MM-DD HH:mm:ss"));
    }

    getStorageValue() {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const value = yield _webinyModel.DateAttribute.prototype.getStorageValue.call(_this);
            if (value instanceof Date) {
                return _fecha2.default.format(value, "YYYY-MM-DD HH:mm:ss");
            }
            return value;
        })();
    }
}

exports.default = DateAttribute;
//# sourceMappingURL=dateAttribute.js.map
