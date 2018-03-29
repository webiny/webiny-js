// @flow
import type Table from "./table";
import IndexesContainer from "./indexesContainer";

class Index {
    name: ?string;
    type: string;
    columns: Array<string>;
    indexesContainer: IndexesContainer;

    constructor(name: ?string, indexesContainer: IndexesContainer, columns: Array<string> = []) {
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
    getName(): ?string {
        return this.name;
    }

    getType(): string {
        return "";
    }

    /**
     * Returns parent table indexes container
     */
    getParentIndexesContainer(): IndexesContainer {
        return this.indexesContainer;
    }

    /**
     * Returns table
     */
    getParentTable(): Table {
        return this.getParentIndexesContainer().getParentTable();
    }

    getColumns(): Array<string> {
        return this.columns;
    }

    getObjectValue(): {} {
        return {
            name: this.getName(),
            type: this.getType(),
            columns: this.getColumns()
        };
    }
}

export default Index;
