"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _or = require("../logical/or");

var _or2 = _interopRequireDefault(_or);

var _and = require("../logical/and");

var _and2 = _interopRequireDefault(_and);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

const search = {
    canProcess: ({ key }) => {
        return key === "$search";
    },
    process: ({ value, statement }) => {
        const columns = value.columns.map(columns => {
            return { [columns]: { $like: "%" + value.query + "%" } };
        });

        if (value.operator === "and") {
            return _and2.default.process({ key: "$and", value: columns, statement });
        }
        return _or2.default.process({ key: "$or", value: columns, statement });
    }
};
exports.default = search;
//# sourceMappingURL=search.js.map
