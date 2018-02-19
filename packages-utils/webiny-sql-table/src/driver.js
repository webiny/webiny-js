// @flow
import ColumnsContainer from "./columnsContainer";
import IndexesContainer from "./indexesContainer";
import type Table from "./table";

class Driver {
    connection: mixed;

    constructor() {
        this.connection = null;
    }

    getColumnsClass(): Class<ColumnsContainer> {
        return ColumnsContainer;
    }

    getIndexesClass(): Class<IndexesContainer> {
        return IndexesContainer;
    }

    // eslint-disable-next-line
    async sync(table: Table, params: {}): Promise<mixed> {
        return null;
    }

    getConnection(): mixed {
        return this.connection;
    }
}

export default Driver;
