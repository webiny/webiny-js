"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _statement = require("./statement");

var _statement2 = _interopRequireDefault(_statement);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Select extends _statement2.default {
    generate() {
        const options = this.options;
        let output = `SELECT`;
        if (options.calculateFoundRows) {
            output += ` SQL_CALC_FOUND_ROWS`;
        }

        output += this.getColumns(options);
        output += ` FROM \`${options.table}\``;
        output += this.getWhere(options);
        output += this.getOrder(options);
        output += this.getLimit(options);
        output += this.getOffset(options);

        return output;
    }
}

exports.default = Select;
//# sourceMappingURL=select.js.map
