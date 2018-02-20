// @flow
import ColumnsContainer from "./columnsContainer";
import IndexesContainer from "./indexesContainer";
import { Driver, Table } from "webiny-sql-table";
import { MySQLConnection } from "webiny-mysql-connection";
import { createTable, alterTable, truncateTable, dropTable, tableExists } from "./sql";
import type { Connection, ConnectionOptions, Pool } from "mysql";

declare type MySQLDriverOptions = {
    connection: Connection | Pool | ConnectionOptions
};

class MySQLDriver extends Driver {
    connection: Connection | Pool | ConnectionOptions;

    constructor(options: MySQLDriverOptions) {
        super();
        this.connection = new MySQLConnection(options.connection);
    }

    getColumnsClass(): Class<ColumnsContainer> {
        return ColumnsContainer;
    }

    getIndexesClass(): Class<IndexesContainer> {
        return IndexesContainer;
    }

    async create(table: Table) {
        const sql = createTable(table);
        return await this.getConnection().query(sql);
    }

    async update(table: Table) {
        const sql = alterTable(table);
        return await this.getConnection().query(sql);
    }

    async exists(table: Table): Promise<boolean> {
        const sql = tableExists(table);
        return await this.getConnection().query(sql);
    }

    async delete(table: Table) {
        const sql = dropTable(table);
        return await this.getConnection().query(sql);
    }

    async empty(table: Table) {
        const sql = truncateTable(table);
        return await this.getConnection().query(sql);
    }
}

export default MySQLDriver;
