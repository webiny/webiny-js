"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class IndexesContainer {
    constructor(table) {
        /**
         * Contains all registered indexes.
         * @type {Array}
         */
        this.indexes = [];

        /**
         * Parent parentTable - instance of Table class.
         */
        this.parentTable = table;

        /**
         * Temporary stored name that will be assigned to newly created index.
         */
        this.newIndexName = "";
    }

    index(newIndexName) {
        this.newIndexName = newIndexName;
        return this;
    }

    getIndexes() {
        return this.indexes;
    }

    getIndex(name) {
        return _lodash2.default.find(this.indexes, { name });
    }

    getParentTable() {
        return this.parentTable;
    }
}
exports.default = IndexesContainer;
//# sourceMappingURL=indexesContainer.js.map
