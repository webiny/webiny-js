"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinySqlTable = require("webiny-sql-table");

var _columnsContainer = require("../columnsContainer");

var _columnsContainer2 = _interopRequireDefault(_columnsContainer);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Column extends _webinySqlTable.Column {
    constructor(name, columnsContainer, columnArguments = []) {
        super(name, columnsContainer, columnArguments);

        /**
         * Column's default value.
         * @var null
         */
        this.default = undefined;

        /**
         * Defines if column accept NULL values.
         * @var null
         */
        this.notNull = false;

        /**
         * Only for numeric columns - defines if column can receive negative values or not.
         * @type {null}
         */
        this.unsigned = null;

        /**
         * Only for numeric columns - defines if column must be auto-incremented or not.
         * @type {null}
         */
        this.autoIncrement = null;
    }

    /**
     * Returns SQL definition if column.
     * @returns {string}
     */
    getSQLValue() {
        let sql = `\`${this.getName()}\` ${this.getType()}`;

        if (this.hasArguments()) {
            sql += `(${this.getArguments()
                .map(item => {
                    return typeof item === "string" ? `'${item}'` : item;
                })
                .join(", ")})`;
        }

        if (this.getUnsigned() === true) {
            sql += " unsigned";
        }

        if (this.getNotNull() === true) {
            sql += " NOT NULL";
        }

        if (typeof this.getDefault() !== "undefined") {
            const value = this.getDefault();
            if (typeof value === "number") {
                sql += ` DEFAULT ${value}`;
            } else if (value === null) {
                sql += ` DEFAULT NULL`;
            } else {
                sql += ` DEFAULT '${String(value)}'`;
            }
        }

        if (this.getAutoIncrement()) {
            sql += ` AUTO_INCREMENT`;
        }

        return sql;
    }

    /**
     * Sets default column value.
     */
    setDefault(defaultValue) {
        this.default = defaultValue;
        return this;
    }

    /**
     * Returns default column value.
     */
    getDefault() {
        return this.default;
    }

    setNotNull(notNull = true) {
        this.notNull = notNull;
        return this;
    }

    getNotNull() {
        return this.notNull;
    }

    getArguments() {
        return this.arguments;
    }

    hasArguments() {
        return Array.isArray(this.arguments) && this.arguments.length > 0;
    }

    setUnsigned(unsigned = true) {
        this.unsigned = unsigned;
        return this;
    }

    getUnsigned() {
        return this.unsigned;
    }

    setAutoIncrement(autoIncrement = true) {
        this.autoIncrement = autoIncrement;
        return this;
    }

    getAutoIncrement() {
        return this.autoIncrement;
    }

    getObjectValue() {
        return {
            name: this.getName(),
            type: this.getType(),
            arguments: this.getArguments(),
            default: this.getDefault(),
            unsigned: this.getUnsigned(),
            autoIncrement: this.getAutoIncrement(),
            notNull: this.getNotNull()
        };
    }
}

exports.default = Column;
//# sourceMappingURL=column.js.map
