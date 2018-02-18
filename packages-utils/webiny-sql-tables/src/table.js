import DefaultColumnsContainer from "./defaultColumnsContainer";
import DefaultIndexesContainer from "./defaultIndexesContainer";
import Column from "./column";
import Index from "./index";

class Table {
    columns: { [string]: Column };
    indexes: { [string]: Index };
    columnsContainer: DefaultColumnsContainer;
    indexesContainer: DefaultIndexesContainer;

    constructor() {
        this.columns = {};
        this.indexes = {};
        this.columnsContainer = this.createColumnsContainer();
        this.indexesContainer = this.createIndexesContainer();
    }

    column(column: string): DefaultColumnsContainer {
        return this.getColumnsContainer().column(column);
    }

    index(index: string): DefaultIndexesContainer {
        return this.getIndexesContainer().index(index);
    }

    createColumnsContainer(): DefaultColumnsContainer {
        return new DefaultColumnsContainer(this);
    }

    createIndexesContainer(): DefaultIndexesContainer {
        return new DefaultIndexesContainer(this);
    }

    getColumnsContainer(): DefaultColumnsContainer {
        return this.columnsContainer;
    }

    getIndexesContainer(): DefaultIndexesContainer {
        return this.indexesContainer;
    }

    getColumn(column: string): ?Column {
        if (column in this.columns) {
            return this.columns[column];
        }
        return undefined;
    }

    setColumn(name: string, column: Column): this {
        this.columns[name] = column;
        return this;
    }

    getColumns(): { [string]: Column } {
        return this.columns;
    }

    getIndex(index: string): ?Index {
        if (index in this.indexes) {
            return this.indexes[index];
        }
        return undefined;
    }

    setIndex(name: string, index: Index): this {
        this.indexes[name] = index;
        return this;
    }

    getIndexes(): { [string]: Index } {
        return this.indexes;
    }

    toJSON(): { [string]: {} } {
        const json = [];
        for (let name in this.getColumns()) {
            const column = ((this.getColumn(name): any): Column);
            json.push = column.getJSONValue();
        }
        return json;
    }
}

export default Table;
