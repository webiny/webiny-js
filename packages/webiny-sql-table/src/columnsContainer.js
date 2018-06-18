// @flow
import type Table from "./table";
import type Column from "./column";
import _ from "lodash";

class ColumnsContainer {
    parentTable: Table;
    newColumnName: ?string;
    columns: Array<Column>;

    constructor(table: Table) {
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

    column(newColumnName: string): ColumnsContainer {
        this.newColumnName = newColumnName;
        return this;
    }

    getColumns(): Array<Column> {
        return this.columns;
    }

    getColumn(name: string): ?Column {
        return _.find(this.columns, { name });
    }

    getParentTable(): Table {
        return this.parentTable;
    }
}

export default ColumnsContainer;
