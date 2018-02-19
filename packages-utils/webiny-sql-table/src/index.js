// @flow
import type Table from "./table";
import IndexesContainer from "./indexesContainer";

class Index {
    name: ?string;
    type: string;
    columns: ?Array<string>;
    indexesContainer: IndexesContainer;

    constructor(
        name: ?string = null,
        indexesContainer: IndexesContainer,
        columns: ?Array<string> = null
    ) {
        /**
         * Index name.
         */
        this.name = name;

        /**
         * Index's parent table instance.
         */
        this.indexesContainer = indexesContainer;

        /**
         * The maximum number of digits.
         * @type {number}
         */
        this.columns = columns;
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

    getColumns() {
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
