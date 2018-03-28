"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _entries = require("babel-runtime/core-js/object/entries");

var _entries2 = _interopRequireDefault(_entries);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

const or = {
    canProcess: ({ key }) => {
        return key === "$or";
    },
    process: ({ value, statement }) => {
        let output = "";
        switch (true) {
            case _lodash2.default.isArray(value):
                value.forEach(object => {
                    for (const [orKey, orValue] of (0, _entries2.default)(object)) {
                        if (output === "") {
                            output = statement.process({ [orKey]: orValue });
                        } else {
                            output += " OR " + statement.process({ [orKey]: orValue });
                        }
                    }
                });
                break;
            case _lodash2.default.isPlainObject(value):
                for (const [orKey, orValue] of (0, _entries2.default)(value)) {
                    if (output === "") {
                        output = statement.process({ [orKey]: orValue });
                    } else {
                        output += " OR " + statement.process({ [orKey]: orValue });
                    }
                }
                break;
            default:
                throw Error("$or operator must receive an object or an array.");
        }

        return "(" + output + ")";
    }
};
exports.default = or;
//# sourceMappingURL=or.js.map
