// @flow
import type Table from "./table";
import ColumnsContainer from "./columnsContainer";

class Column {
    name: string;
    type: string;
    columnsContainer: ColumnsContainer;
    arguments: Array<string | number>;
    constructor(
        name: string,
        columnsContainer: ColumnsContainer,
        columnArguments: Array<string | number> = []
    ) {
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
    getName(): string {
        return this.name;
    }

    /**
     *
     * @returns {string}
     */
    getType(): string {
        return "";
    }

    getArguments(): Array<string | number> {
        return this.arguments;
    }

    /**
     * Returns parent table columns container
     */
    getParentColumnsContainer(): ColumnsContainer {
        return this.columnsContainer;
    }

    /**
     * Returns table
     */
    getParentTable(): Table {
        return this.getParentColumnsContainer().getParentTable();
    }

    getObjectValue(): Object {
        return {
            name: this.getName(),
            type: this.getType(),
            arguments: this.getArguments()
        };
    }
}

export default Column;
