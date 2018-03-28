"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

const lte = {
    canProcess: ({ value }) => {
        return _lodash2.default.has(value, "$lte");
    },
    process: ({ key, value, statement }) => {
        return key + " <= " + statement.escape(value["$lte"]);
    }
};
exports.default = lte;
//# sourceMappingURL=lte.js.map
