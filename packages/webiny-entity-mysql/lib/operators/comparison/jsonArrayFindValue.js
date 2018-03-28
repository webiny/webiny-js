"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

const jsonArrayFindValue = {
    canProcess: ({ value }) => {
        return _lodash2.default.has(value, "$jsonArrayFindValue");
    },
    process: ({ key, value, statement }) => {
        value = value["$jsonArrayFindValue"];
        return "JSON_SEARCH(" + key + ", 'one', " + statement.escape(value) + ") IS NOT NULL";
    }
};
exports.default = jsonArrayFindValue;
//# sourceMappingURL=jsonArrayFindValue.js.map
