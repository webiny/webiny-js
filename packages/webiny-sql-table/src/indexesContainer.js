// @flow
import type Table from "./table";
import type Index from "./tableIndex";
import _ from "lodash";

class IndexesContainer {
    parentTable: Table;
    newIndexName: ?string;
    indexes: Array<Index>;

    constructor(table: Table) {
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

    index(newIndexName: ?string): IndexesContainer {
        this.newIndexName = newIndexName;
        return this;
    }

    getIndexes(): Array<Index> {
        return this.indexes;
    }

    getIndex(name: string): ?Index {
        return _.find(this.indexes, { name });
    }

    getParentTable(): Table {
        return this.parentTable;
    }
}

export default IndexesContainer;
