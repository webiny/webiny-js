"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _columnsContainer = require("./columnsContainer");

var _columnsContainer2 = _interopRequireDefault(_columnsContainer);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Column {
    constructor(name, columnsContainer, columnArguments = []) {
        /**
         * Column name.
         */
        this.name = name;

        /**
         * Column's parent table instance.
         */
        this.columnsContainer = columnsContainer;

        /**
         * Arguments that will set when generating SQL in parentheses, eg. "bigint(20)".
         * @type {Array}
         */
        this.arguments = columnArguments;
    }

    /**
     * Returns name of column
     */
    getName() {
        return this.name;
    }

    /**
     *
     * @returns {string}
     */
    getType() {
        return "";
    }

    getArguments() {
        return this.arguments;
    }

    /**
     * Returns parent table columns container
     */
    getParentColumnsContainer() {
        return this.columnsContainer;
    }

    /**
     * Returns table
     */
    getParentTable() {
        return this.getParentColumnsContainer().getParentTable();
    }

    getObjectValue() {
        return {
            name: this.getName(),
            type: this.getType(),
            arguments: this.getArguments()
        };
    }
}

exports.default = Column;
//# sourceMappingURL=column.js.map
