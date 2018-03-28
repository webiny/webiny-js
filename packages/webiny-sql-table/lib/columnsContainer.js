"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class ColumnsContainer {
    constructor(table) {
        /**
         * Contains all registered columns.
         * @type {Array}
         */
        this.columns = [];

        /**
         * Parent parentTable - instance of Table class.
         */
        this.parentTable = table;

        /**
         * Temporary stored name that will be assigned to newly created column.
         */
        this.newColumnName = "";
    }

    column(newColumnName) {
        this.newColumnName = newColumnName;
        return this;
    }

    getColumns() {
        return this.columns;
    }

    getColumn(name) {
        return _lodash2.default.find(this.columns, { name });
    }

    getParentTable() {
        return this.parentTable;
    }
}
exports.default = ColumnsContainer;
//# sourceMappingURL=columnsContainer.js.map
