// @flow
import type Table from "./table";

class ColumnsContainer {
    parentTable: Table;
    name: string;

    constructor(table: Table) {
        /**
         * Parent parentTable - instance of Table class.
         */
        this.parentTable = table;

        /**
         * Name of current column
         */
        this.name = "";
    }

    column(column: string): ColumnsContainer {
        this.name = column;
        return this;
    }

    getParentTable(): Table {
        return this.parentTable;
    }
}

export default ColumnsContainer;
