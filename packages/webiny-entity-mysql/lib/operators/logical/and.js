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

const and = {
    canProcess: ({ key }) => {
        return key === "$and";
    },
    process: ({ value, statement }) => {
        let output = "";
        switch (true) {
            case _lodash2.default.isArray(value):
                value.forEach(object => {
                    for (const [andKey, andValue] of (0, _entries2.default)(object)) {
                        if (output === "") {
                            output = statement.process({ [andKey]: andValue });
                        } else {
                            output += " AND " + statement.process({ [andKey]: andValue });
                        }
                    }
                });
                break;
            case _lodash2.default.isPlainObject(value):
                for (const [andKey, andValue] of (0, _entries2.default)(value)) {
                    if (output === "") {
                        output = statement.process({ [andKey]: andValue });
                    } else {
                        output += " AND " + statement.process({ [andKey]: andValue });
                    }
                }
                break;
            default:
                throw Error("$and operator must receive an object or an array.");
        }

        return "(" + output + ")";
    }
};
exports.default = and;
//# sourceMappingURL=and.js.map
