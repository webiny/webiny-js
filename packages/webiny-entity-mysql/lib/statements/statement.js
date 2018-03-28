"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _values = require("babel-runtime/core-js/object/values");

var _values2 = _interopRequireDefault(_values);

var _entries = require("babel-runtime/core-js/object/entries");

var _entries2 = _interopRequireDefault(_entries);

var _sqlstring = require("sqlstring");

var _sqlstring2 = _interopRequireDefault(_sqlstring);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Statement {
    constructor(options = {}, entity) {
        this.options = options;
        this.entity = entity;
    }

    generate() {
        return "";
    }

    getColumns(options) {
        const columns = options.columns || [];

        if (_lodash2.default.isEmpty(columns)) {
            return " *";
        }

        return " " + columns.join(", ");
    }

    getWhere(options) {
        if (_lodash2.default.isEmpty(options.where)) {
            return "";
        }

        return " WHERE " + this.process({ $and: options.where });
    }

    getOrder(options) {
        if (!options.order || !options.order.length) {
            return "";
        }

        let query = [];

        options.order.forEach(order => {
            query.push(`${order[0]} ${order[1] === 1 ? "ASC" : "DESC"}`);
        });

        return " ORDER BY " + query.join(", ");
    }

    getLimit(options) {
        const limit = options.limit || 0;

        if (_lodash2.default.isNumber(limit) && limit > 0) {
            return ` LIMIT ${limit}`;
        }
        return "";
    }

    getOffset(options) {
        const offset = options.offset || 0;

        if (_lodash2.default.isNumber(offset) && offset > 0) {
            return ` OFFSET ${offset}`;
        }
        return "";
    }

    escape(value) {
        return _sqlstring2.default.escape(value);
    }

    /**
     * Traverse the payload and apply operators to construct a valid MySQL statement
     * @private
     * @param {Object} payload
     * @returns {string} SQL query
     */
    process(payload) {
        let output = "";

        outerLoop: for (const [key, value] of (0, _entries2.default)(payload)) {
            const operators = (0, _values2.default)(this.options.operators);
            for (let i = 0; i < operators.length; i++) {
                const operator = operators[i];
                if (operator.canProcess({ key, value, statement: this })) {
                    output += operator.process({ key, value, statement: this });
                    continue outerLoop;
                }
            }
            throw new Error(`Invalid operator {${key} : ${value}}.`);
        }

        return output;
    }
}

exports.default = Statement;
//# sourceMappingURL=statement.js.map
