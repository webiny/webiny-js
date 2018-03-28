"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

const lt = {
    canProcess: ({ value }) => {
        return _lodash2.default.has(value, "$lt");
    },
    process: ({ key, value, statement }) => {
        return key + " < " + statement.escape(value["$lt"]);
    }
};
exports.default = lt;
//# sourceMappingURL=lt.js.map
