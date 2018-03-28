"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

const ne = {
    canProcess: ({ value }) => {
        return _lodash2.default.has(value, "$ne");
    },
    process: ({ key, value, statement }) => {
        if (value["$ne"] === null) {
            return key + " IS NOT NULL";
        }

        return key + " <> " + statement.escape(value["$ne"]);
    }
};
exports.default = ne;
//# sourceMappingURL=ne.js.map
