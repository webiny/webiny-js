"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _entries = require("babel-runtime/core-js/object/entries");

var _entries2 = _interopRequireDefault(_entries);

var _statement = require("./statement");

var _statement2 = _interopRequireDefault(_statement);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Update extends _statement2.default {
    generate() {
        const values = [],
            options = this.options;
        for (const [key, value] of (0, _entries2.default)(options.data)) {
            values.push(key + " = " + this.escape(value));
        }

        let output = `UPDATE \`${options.table}\` SET ${values.join(", ")}`;
        output += this.getWhere(options);
        output += this.getOrder(options);
        output += this.getLimit(options);
        output += this.getOffset(options);

        return output;
    }
}

exports.default = Update;
//# sourceMappingURL=update.js.map
