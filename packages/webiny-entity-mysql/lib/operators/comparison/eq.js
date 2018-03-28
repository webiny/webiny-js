"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _webinyModel = require("webiny-model");

var _jsonArrayStrictEquality = require("./../comparison/jsonArrayStrictEquality");

var _jsonArrayStrictEquality2 = _interopRequireDefault(_jsonArrayStrictEquality);

var _jsonArrayFindValue = require("./../comparison/jsonArrayFindValue");

var _jsonArrayFindValue2 = _interopRequireDefault(_jsonArrayFindValue);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

const eq = {
    canProcess: ({ key, value, statement }) => {
        if (key.charAt(0) === "$") {
            return false;
        }

        if (_lodash2.default.has(value, "$eq")) {
            return true;
        }

        // Valid values are 1, '1', null, true, false.
        if (
            _lodash2.default.isString(value) ||
            _lodash2.default.isNumber(value) ||
            [null, true, false].includes(value)
        ) {
            return true;
        }

        const instance =
            typeof statement.entity === "function" ? new statement.entity() : statement.entity;
        const attribute = instance.getAttribute(key);
        return attribute instanceof _webinyModel.ArrayAttribute && Array.isArray(value);
    },
    process: ({ key, value, statement }) => {
        value = _lodash2.default.get(value, "$eq", value);
        if (value === null) {
            return key + " IS NULL";
        }

        const instance =
            typeof statement.entity === "function" ? new statement.entity() : statement.entity;
        const attribute = instance.getAttribute(key);
        if (attribute instanceof _webinyModel.ArrayAttribute) {
            // Match all values (strict array equality check)
            if (Array.isArray(value)) {
                return _jsonArrayStrictEquality2.default.process({
                    key,
                    value: { $jsonArrayStrictEquality: value },
                    statement
                });
            } else {
                return _jsonArrayFindValue2.default.process({
                    key,
                    value: { $jsonArrayFindValue: value },
                    statement
                });
            }
        }

        return key + " = " + statement.escape(value);
    }
};

exports.default = eq;
//# sourceMappingURL=eq.js.map
