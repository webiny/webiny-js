// @flow
import type Table from "./table";

class IndexesContainer {
    parentTable: Table;
    name: string;

    constructor(table: Table) {
        /**
         * Parent parentTable - instance of Table class.
         */
        this.parentTable = table;

        /**
         * Name of current index
         */
        this.name = "";
    }

    index(index: string): IndexesContainer {
        this.name = index;
        return this;
    }

    getParentTable(): Table {
        return this.parentTable;
    }
}

export default IndexesContainer;
