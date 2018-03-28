"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _entries = require("babel-runtime/core-js/object/entries");

var _entries2 = _interopRequireDefault(_entries);

var _statement = require("./statement");

var _statement2 = _interopRequireDefault(_statement);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Insert extends _statement2.default {
    generate() {
        const options = this.options;
        const columns = _lodash2.default.keys(options.data).join(", ");
        const insertValues = _lodash2.default
            .values(options.data)
            .map(value => this.escape(value))
            .join(", ");

        if (!options.onDuplicateKeyUpdate) {
            return `INSERT INTO \`${options.table}\` (${columns}) VALUES (${insertValues})`;
        }

        const updateValues = [];
        for (const [key, value] of (0, _entries2.default)(options.data)) {
            updateValues.push(key + " = " + this.escape(value));
        }

        return `INSERT INTO \`${
            options.table
        }\` (${columns}) VALUES (${insertValues}) ON DUPLICATE KEY UPDATE ${updateValues.join(
            ", "
        )}`;
    }
}

exports.default = Insert;
//# sourceMappingURL=insert.js.map
