"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

const gte = {
    canProcess: ({ value }) => {
        return _lodash2.default.has(value, "$gte");
    },
    process: ({ key, value, statement }) => {
        return key + " >= " + statement.escape(value["$gte"]);
    }
};
exports.default = gte;
//# sourceMappingURL=gte.js.map
