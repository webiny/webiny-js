// @flow
import type Table from "./table";
import IndexesContainer from "./indexesContainer";

class Index {
    name: string;
    type: string;
    indexesContainer: IndexesContainer;

    constructor(name: string, indexesContainer: IndexesContainer) {
        /**
         * Index name.
         */
        this.name = name;

        /**
         * Index's parent table instance.
         */
        this.indexesContainer = indexesContainer;
    }

    /**
     * Returns name of index
     */
    getName(): string {
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

    getObjectValue(): {} {
        return {
            name: this.getName(),
            type: this.getType()
        };
    }
}

export default Index;
