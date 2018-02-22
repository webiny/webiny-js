import ColumnsContainer from "./columnsContainer";
import IndexesContainer from "./indexesContainer";
import Column from "./column";
import Index from "./index";
import Driver from "./driver";

class Table {
    static engine: string;
    static tableName: string;
    static defaultCharset: string;
    static collate: string;
    static comment: ?string;
    static autoIncrement: ?number;
    columns: { [string]: Column };
    indexes: { [string]: Index };
    columnsContainer: ColumnsContainer;
    indexesContainer: IndexesContainer;

    constructor() {
        this.engine = null;
        this.tableName = null;
        this.defaultCharset = null;
        this.collate = null;
        this.comment = null;
        this.autoIncrement = null;
        this.columns = {};
        this.indexes = {};
        this.columnsContainer = this.createColumnsContainer();
        this.indexesContainer = this.createIndexesContainer();
    }

    column(name: string): ColumnsContainer {
        return this.getColumnsContainer().column(name);
    }

    index(name: string): IndexesContainer {
        return this.getIndexesContainer().index(name);
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

    getColumn(name: string): ?Column {
        return this.getColumnsContainer().getColumn(name);
    }

    setColumn(name: string, column: Column): this {
        this.columns[name] = column;
        return this;
    }

    getColumns(): { [string]: Column } {
        return this.getColumnsContainer().getColumns();
    }

    getIndex(name: string): ?Index {
        return this.getIndexesContainer().getIndex(name);
    }

    setIndex(name: string, index: Index): this {
        this.indexes[name] = index;
        return this;
    }

    getIndexes(): { [string]: Index } {
        return this.getIndexesContainer().getIndexes();
    }

    toObject(): { [string]: {} } {
        const json = {
            autoIncrement: this.constructor.getAutoIncrement(),
            name: this.constructor.getName(),
            comment: this.constructor.getComment(),
            engine: this.constructor.getEngine(),
            collate: this.constructor.getCollate(),
            defaultCharset: this.constructor.getDefaultCharset(),
            columns: [],
            indexes: []
        };

        this.getColumns().forEach(column => {
            json.columns.push(column.getObjectValue());
        });

        this.getIndexes().forEach(index => {
            json.indexes.push(index.getObjectValue());
        });

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

    static setEngine(value) {
        this.engine = value;
        return this;
    }

    static getEngine() {
        return this.engine;
    }

    static setDefaultCharset(defaultCharset) {
        this.defaultCharset = defaultCharset;
        return this;
    }

    static getDefaultCharset() {
        return this.defaultCharset;
    }

    static setCollate(collate) {
        this.collate = collate;
        return this;
    }

    static getCollate() {
        return this.collate;
    }

    static setName(name) {
        this.tableName = name;
        return this;
    }

    static getName() {
        return this.tableName;
    }

    getName() {
        return this.constructor.getName();
    }

    static setComment(comment) {
        this.comment = comment;
        return this;
    }

    static getComment() {
        return this.comment;
    }

    getComment() {
        return this.constructor.getComment();
    }

    static setAutoIncrement(autoIncrement: number) {
        this.autoIncrement = autoIncrement;
        return this;
    }

    static getAutoIncrement() {
        return this.autoIncrement;
    }

    getAutoIncrement() {
        return this.constructor.getAutoIncrement();
    }

    async create() {
        return this.getDriver().create(this);
    }

    async update() {
        return this.getDriver().update(this);
    }

    async exists() {
        return this.getDriver().exists(this);
    }

    async sync() {
        if (await this.exists()) {
            return this.update(this);
        }
        return this.create(this);
    }

    async delete() {
        return this.getDriver().delete(this);
    }

    async empty() {
        return this.getDriver().empty(this);
    }
}

Table.engine = null;
Table.tableName = null;
Table.defaultCharset = null;
Table.collate = null;
Table.comment = null;
Table.autoIncrement = null;

Table.setDriver(new Driver());

export default Table;
