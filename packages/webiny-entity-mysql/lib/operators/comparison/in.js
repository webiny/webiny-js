"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _webinyModel = require("webiny-model");

var _or = require("../logical/or");

var _or2 = _interopRequireDefault(_or);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

const inOperator = {
    canProcess: ({ key, value, statement }) => {
        if (key.charAt(0) === "$") {
            return false;
        }

        if (_lodash2.default.has(value, "$in")) {
            return true;
        }

        const instance =
            typeof statement.entity === "function" ? new statement.entity() : statement.entity;
        const attribute = instance.getAttribute(key);

        return Array.isArray(value) && !(attribute instanceof _webinyModel.ArrayAttribute);
    },
    process: ({ key, value, statement }) => {
        value = _lodash2.default.get(value, "$in", value);

        const instance =
            typeof statement.entity === "function" ? new statement.entity() : statement.entity;
        const attribute = instance.getAttribute(key);
        if (attribute instanceof _webinyModel.ArrayAttribute) {
            const andValue = value.map(v => {
                return { [key]: { $jsonArrayFindValue: v } };
            });
            return _or2.default.process({ key, value: andValue, statement });
        }

        return key + " IN(" + value.map(item => statement.escape(item)).join(", ") + ")";
    }
};
exports.default = inOperator;
//# sourceMappingURL=in.js.map
