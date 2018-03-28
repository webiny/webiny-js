"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

const jsonArrayStrictEquality = {
    canProcess: ({ value }) => {
        return _lodash2.default.has(value, "$jsonArrayStrictEquality");
    },
    process: ({ key, value, statement }) => {
        value = value["$jsonArrayStrictEquality"];
        return key + " = JSON_ARRAY(" + value.map(v => statement.escape(v)).join(", ") + ")";
    }
};
exports.default = jsonArrayStrictEquality;
//# sourceMappingURL=jsonArrayStrictEquality.js.map
