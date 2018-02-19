import ColumnsContainer from "./columnsContainer";
import IndexesContainer from "./indexesContainer";
import Column from "./column";
import Index from "./index";
import Driver from "./driver";

class Table {
    engine: string;
    columns: { [string]: Column };
    indexes: { [string]: Index };
    columnsContainer: ColumnsContainer;
    indexesContainer: IndexesContainer;

    constructor() {
        this.columns = {};
        this.indexes = {};
        this.columnsContainer = this.createColumnsContainer();
        this.indexesContainer = this.createIndexesContainer();
    }

    column(column: string): ColumnsContainer {
        return this.getColumnsContainer().column(column);
    }

    index(index: string): IndexesContainer {
        return this.getIndexesContainer().index(index);
    }

    createColumnsContainer(): ColumnsContainer {
        const setClass = this.getDriver().getColumnsClass();
        return new setClass(this);
    }

    createIndexesContainer(): IndexesContainer {
        const setClass = this.getDriver().getIndexesClass();
        return new setClass(this);
    }

    getColumnsContainer(): ColumnsContainer {
        return this.columnsContainer;
    }

    getIndexesContainer(): IndexesContainer {
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

    toObject(): { [string]: {} } {
        const json = [];
        for (let name in this.getColumns()) {
            const column = ((this.getColumn(name): any): Column);
            json.push = column.getObjectValue();
        }
        return json;
    }

    static setDriver(driver): this {
        this.driver = driver;
        return this;
    }

    /**
     * Returns instance of set driver.
     */
    static getDriver(): Driver {
        return this.driver;
    }

    /**
     * Returns instance of set driver.
     */
    getDriver(): Driver {
        return this.constructor.driver;
    }
}

Table.setDriver(new Driver());

export default Table;
