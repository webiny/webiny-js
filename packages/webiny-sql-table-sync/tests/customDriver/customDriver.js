//@flow

import { Driver } from "webiny-sql-table";
import ColumnsContainer from "./columnsContainer";
import IndexesContainer from "./indexesContainer";
import type { CommandOptions } from "webiny-sql-table/types";
import { Table } from "webiny-sql-table";

class CustomDriver extends Driver {
    getColumnsClass(): Class<ColumnsContainer> {
        return ColumnsContainer;
    }

    getIndexesClass(): Class<IndexesContainer> {
        return IndexesContainer;
    }

    // eslint-disable-next-line
    async create(table: Table, options: CommandOptions): Promise<string> {
        return "CREATE TABLE " + table.getName() + " (...)";
    }

    // eslint-disable-next-line
    async alter(table: Table, options: CommandOptions): Promise<string> {
        return "ALTER TABLE " + table.getName() + " (...)";
    }

    // eslint-disable-next-line
    async drop(table: Table, options: CommandOptions): Promise<string> {
        return "DROP TABLE " + table.getName() + " (...)";
    }

    // eslint-disable-next-line
    async truncate(table: Table, options: CommandOptions): Promise<string> {
        return "TRUNCATE TABLE " + table.getName() + " (...)";
    }

    // eslint-disable-next-line
    async sync(table: Table, options: CommandOptions): Promise<string> {
        return [this.drop(table, options), this.create(table, options)].join("\n");
    }

    async execute(sql: string) {
        return true;
    }
}

export default CustomDriver;
