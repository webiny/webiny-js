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

var _modelError = require("./../modelError");

var _modelError2 = _interopRequireDefault(_modelError);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class ArrayAttribute extends _attribute2.default {
    /**
     * If value is assigned (checked in the parent validate call), it must by an instance of array.
     */
    validateType(value) {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (Array.isArray(value)) {
                return;
            }
            _this.expected("array", typeof value);
        })();
    }

    /**
     * @returns {Promise<void>}
     */
    validateValue(value) {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const currentValue = value;

            const errors = [];
            for (let i = 0; i < currentValue.length; i++) {
                const current = currentValue[i];
                if (!_this2.__isPrimitiveValue(current)) {
                    errors.push({
                        code: _modelError2.default.INVALID_ATTRIBUTE,
                        data: {
                            index: i
                        },
                        message: `Validation failed, item at index ${i} not a primitive value.`
                    });
                }
            }

            if (!_lodash2.default.isEmpty(errors)) {
                throw new _modelError2.default(
                    "Validation failed.",
                    _modelError2.default.INVALID_ATTRIBUTE,
                    {
                        items: errors
                    }
                );
            }
        })();
    }

    __isPrimitiveValue(value) {
        return (
            _lodash2.default.isString(value) ||
            _lodash2.default.isNumber(value) ||
            _lodash2.default.isBoolean(value) ||
            _lodash2.default.isNull(value)
        );
    }
}
exports.default = ArrayAttribute;
//# sourceMappingURL=arrayAttribute.js.map
