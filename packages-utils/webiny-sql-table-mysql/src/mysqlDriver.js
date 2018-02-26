// @flow
import ColumnsContainer from "./columnsContainer";
import IndexesContainer from "./indexesContainer";
import { Driver, Table } from "webiny-sql-table";
import { MySQLConnection } from "webiny-mysql-connection";
import { createTable, alterTable, truncateTable, dropTable, syncTable } from "./sql";
import { MySQLDriverOptions, MySQL } from "./../types";
import type { CommandOptions } from "webiny-sql-table/types";

class MySQLDriver extends Driver {
    connection: ?MySQLConnection;

    constructor(options: MySQLDriverOptions = {}) {
        super();
        this.connection = null;
        options.connection && this.setConnection(options.connection);
    }

    getConnection(): ?MySQLConnection {
        return this.connection;
    }

    setConnection(connection: MySQL): MySQLDriver {
        this.connection = new MySQLConnection(connection);
        return this;
    }

    getColumnsClass(): Class<ColumnsContainer> {
        return ColumnsContainer;
    }

    getIndexesClass(): Class<IndexesContainer> {
        return IndexesContainer;
    }

    // eslint-disable-next-line
    create(table: Table, options: CommandOptions): string {
        return createTable(table);
    }

    // eslint-disable-next-line
    alter(table: Table, options: CommandOptions): string {
        return alterTable(table);
    }

    // eslint-disable-next-line
    drop(table: Table, options: CommandOptions): string {
        return dropTable(table);
    }

    // eslint-disable-next-line
    truncate(table: Table, options: CommandOptions): string {
        return truncateTable(table);
    }

    // eslint-disable-next-line
    sync(table: Table, options: CommandOptions): string {
        const sql = {
            tableExists: `SHOW TABLES LIKE ${table.getName()};`,
            tableObject: `DESCRIBE '${table.getName()}';`
        };
        return syncTable(table, sql);
    }

    async execute(sql: string) {
        const connection = this.getConnection();
        if (connection instanceof MySQLConnection) {
            return await connection.query(sql);
        }

        throw Error("MySQL connection not set.");
    }
}

export default MySQLDriver;
