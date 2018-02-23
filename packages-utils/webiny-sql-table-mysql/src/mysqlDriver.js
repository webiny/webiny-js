// @flow
import ColumnsContainer from "./columnsContainer";
import IndexesContainer from "./indexesContainer";
import { Driver, Table } from "webiny-sql-table";
import { MySQLConnection } from "webiny-mysql-connection";
import { createTable, alterTable, truncateTable, dropTable } from "./sql";
import { MySQLDriverOptions, MySQL } from "./../types";
import type { CommandOptions } from "webiny-sql-table/types";

class MySQLDriver extends Driver {
    mySQL: ?MySQLConnection;

    constructor(options: MySQLDriverOptions) {
        super();
        this.mySQL = null;
        options.mySQL && this.setMySQL(options.mySQL);
    }

    getMySQL(): MySQL {
        return this.mySQL;
    }

    setMySQL(mySQL: MySQL): MySQLDriver {
        this.mySQL = new MySQLConnection(mySQL);
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

    async execute(sql: string) {
        if (!this.getMySQL()) {
            throw Error("MySQL instance not set.");
        }
        return await this.getMySQL().query(sql);
    }
}

export default MySQLDriver;
