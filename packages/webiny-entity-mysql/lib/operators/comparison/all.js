"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _and = require("./../logical/and");

var _and2 = _interopRequireDefault(_and);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

const all = {
    canProcess: ({ key, value }) => {
        if (key.charAt(0) === "$") {
            return false;
        }

        return _lodash2.default.has(value, "$all");
    },
    process: ({ key, value, statement }) => {
        const andValue = value["$all"].map(v => {
            return { [key]: { $jsonArrayFindValue: v } };
        });
        return _and2.default.process({ key, value: andValue, statement });
    }
};

exports.default = all;
//# sourceMappingURL=all.js.map
