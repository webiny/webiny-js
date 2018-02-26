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
    create(table: Table, options: CommandOptions): string {
        return "CREATE TABLE " + table.getName() + " (...)";
    }

    // eslint-disable-next-line
    alter(table: Table, options: CommandOptions): string {
        return "ALTER TABLE " + table.getName() + " (...)";
    }

    // eslint-disable-next-line
    drop(table: Table, options: CommandOptions): string {
        return "DROP TABLE " + table.getName() + " (...)";
    }

    // eslint-disable-next-line
    truncate(table: Table, options: CommandOptions): string {
        return "TRUNCATE TABLE " + table.getName() + " (...)";
    }

    // eslint-disable-next-line
    sync(table: Table, options: CommandOptions): string {
        return [this.drop(table, options), this.create(table, options)].join("\n");
    }

    async execute(sql: string) {
        return true;
    }
}

export default CustomDriver;
