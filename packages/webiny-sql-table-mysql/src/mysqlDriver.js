// @flow
import ColumnsContainer from "./columnsContainer";
import IndexesContainer from "./indexesContainer";
import { Driver, Table } from "webiny-sql-table";
import { createTable, alterTable, truncateTable, dropTable } from "./sql";
import type { MySQLDriverOptions, MySQL } from "./../types";
import type { CommandOptions } from "webiny-sql-table/types";

class MySQLDriver extends Driver {
    connection: ?Object;

    constructor(options: MySQLDriverOptions = {}) {
        super();
        this.connection = null;
        options.connection && this.setConnection(options.connection);
    }

    getConnection(): ?Object {
        return this.connection;
    }

    setConnection(connection: MySQL): MySQLDriver {
        this.connection = connection;
        return this;
    }

    getColumnsClass(): Class<ColumnsContainer> {
        return ColumnsContainer;
    }

    getIndexesClass(): Class<IndexesContainer> {
        return IndexesContainer;
    }

    // eslint-disable-next-line
    async create(table: Table, options: CommandOptions) {
        return createTable(table);
    }

    // eslint-disable-next-line
    async alter(table: Table, options: CommandOptions) {
        return alterTable(table);
    }

    // eslint-disable-next-line
    async drop(table: Table, options: CommandOptions) {
        return dropTable(table);
    }

    // eslint-disable-next-line
    async truncate(table: Table, options: CommandOptions) {
        return truncateTable(table);
    }

    // eslint-disable-next-line
    async sync(table: Table, options: CommandOptions) {
        const hasTable = await this.execute(`SHOW TABLES LIKE '${table.getName()}'`);
        if (hasTable.length) {
            // Table exist, we must alter the table.
            // const tableStructure = await this.execute(`DESCRIBE ${table.getName()}`);
            return "";
        }

        // Table does not exist, we can safely return SQL for new table creation create a new table.
        return this.create(table, options);
    }

    async execute(sql: string): Promise<Array<mixed>> {
        const connection = this.getConnection();
        if (connection) {
            return await connection.query(sql);
        }

        throw Error("MySQL connection not set.");
    }
}

export default MySQLDriver;
