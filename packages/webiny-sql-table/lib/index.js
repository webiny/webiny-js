"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _indexesContainer = require("./indexesContainer");

var _indexesContainer2 = _interopRequireDefault(_indexesContainer);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Index {
    constructor(name, indexesContainer, columns = []) {
        /**
         * If name is missing, let's automatically generate one - based on passed columns.
         * @type {string}
         */
        this.name = name || columns.join("_");

        /**
         * Index's parent table instance.
         */
        this.indexesContainer = indexesContainer;

        /**
         * The maximum number of digits.
         * @type {number}
         */
        this.columns = columns;
        if (!this.columns.length) {
            throw Error(`Columns not defined for index "${this.name}".`);
        }
    }

    /**
     * Returns name of index
     */
    getName() {
        return this.name;
    }

    getType() {
        return "";
    }

    /**
     * Returns parent table indexes container
     */
    getParentIndexesContainer() {
        return this.indexesContainer;
    }

    /**
     * Returns table
     */
    getParentTable() {
        return this.getParentIndexesContainer().getParentTable();
    }

    getColumns() {
        return this.columns;
    }

    getObjectValue() {
        return {
            name: this.getName(),
            type: this.getType(),
            columns: this.getColumns()
        };
    }
}

exports.default = Index;
//# sourceMappingURL=index.js.map
