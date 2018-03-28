"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

const gt = {
    canProcess: ({ value }) => {
        return _lodash2.default.has(value, "$gt");
    },
    process: ({ key, value, statement }) => {
        return key + " > " + statement.escape(value["$gt"]);
    }
};
exports.default = gt;
//# sourceMappingURL=gt.js.map
