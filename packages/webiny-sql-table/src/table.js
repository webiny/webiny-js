// @flow
import ColumnsContainer from "./columnsContainer";
import IndexesContainer from "./indexesContainer";
import Column from "./column";
import Index from "./index";
import Driver from "./driver";
import type { CommandOptions } from "../types";

class Table {
    static engine: ?string;
    static tableName: ?string;
    static defaultCharset: ?string;
    static collate: ?string;
    static comment: ?string;
    static autoIncrement: ?number;
    static driver: Driver;
    columnsContainer: ColumnsContainer;
    indexesContainer: IndexesContainer;

    constructor() {
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

    getColumns(): Array<Column> {
        return this.getColumnsContainer().getColumns();
    }

    getIndex(name: string): ?Index {
        return this.getIndexesContainer().getIndex(name);
    }

    getIndexes(): Array<Index> {
        return this.getIndexesContainer().getIndexes();
    }

    toObject(): {} {
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

    /**
     * Sets table driver.
     * @param driver
     * @returns {Table}
     */
    static setDriver(driver: Driver): Class<Table> {
        this.driver = driver;
        return this;
    }

    /**
     * Returns set driver.
     * @returns {Driver}
     */
    static getDriver(): Driver {
        return this.driver;
    }

    /**
     * Returns set driver.
     * @returns {Driver}
     */
    getDriver(): Driver {
        return this.constructor.driver;
    }

    static setEngine(value: string): Class<Table> {
        this.engine = value;
        return this;
    }

    static getEngine(): ?string {
        return this.engine;
    }

    getEngine(): ?string {
        return this.constructor.engine;
    }

    static setDefaultCharset(defaultCharset: string): Class<Table> {
        this.defaultCharset = defaultCharset;
        return this;
    }

    static getDefaultCharset(): ?string {
        return this.defaultCharset;
    }

    getDefaultCharset(): ?string {
        return this.constructor.defaultCharset;
    }

    static setCollate(collate: string): Class<Table> {
        this.collate = collate;
        return this;
    }

    static getCollate(): ?string {
        return this.collate;
    }

    getCollate(): ?string {
        return this.constructor.collate;
    }

    static setName(name: string): Class<Table> {
        this.tableName = name;
        return this;
    }

    static getName(): ?string {
        return this.tableName;
    }

    getName(): ?string {
        return this.constructor.getName();
    }

    static setComment(comment: string): Class<Table> {
        this.comment = comment;
        return this;
    }

    static getComment(): ?string {
        return this.comment;
    }

    getComment(): ?string {
        return this.constructor.getComment();
    }

    static setAutoIncrement(autoIncrement: number) {
        this.autoIncrement = autoIncrement;
        return this;
    }

    static getAutoIncrement(): ?number {
        return this.autoIncrement;
    }

    getAutoIncrement(): ?number {
        return this.constructor.getAutoIncrement();
    }

    async create(options: CommandOptions = {}): Promise<mixed> {
        const sql = await this.getDriver().create(this, options);
        if (options.returnSQL) {
            return sql;
        }

        return this.getDriver().execute(sql);
    }

    async alter(options: CommandOptions = {}): Promise<mixed> {
        const sql = await this.getDriver().alter(this, options);
        if (options.returnSQL) {
            return sql;
        }

        return this.getDriver().execute(sql);
    }

    async drop(options: CommandOptions = {}): Promise<mixed> {
        const sql = await this.getDriver().drop(this, options);
        if (options.returnSQL) {
            return sql;
        }

        return this.getDriver().execute(sql);
    }

    async truncate(options: CommandOptions = {}): Promise<mixed> {
        const sql = await this.getDriver().truncate(this, options);
        if (options.returnSQL) {
            return sql;
        }

        return this.getDriver().execute(sql);
    }

    async sync(options: CommandOptions = {}): Promise<mixed> {
        const sql = await this.getDriver().sync(this, options);
        if (options.returnSQL) {
            return sql;
        }

        return this.getDriver().execute(sql);
    }
}

Table.engine = null;
Table.tableName = null;
Table.defaultCharset = null;
Table.collate = null;
Table.comment = null;
Table.autoIncrement = null;
Table.driver = new Driver();

export default Table;
