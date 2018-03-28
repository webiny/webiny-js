"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

const like = {
    canProcess: ({ key, value }) => {
        if (key.charAt(0) === "$") {
            return false;
        }

        return _lodash2.default.has(value, "$like");
    },
    process: ({ key, value, statement }) => {
        return key + " LIKE " + statement.escape(value["$like"]);
    }
};
exports.default = like;
//# sourceMappingURL=like.js.map
