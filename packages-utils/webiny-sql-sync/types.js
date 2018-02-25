import type { Table } from "webiny-sql-table";

export type LogOptions = {
    log: 1
};

export type SyncOptions = {
    tables: Array<Table>,
    preview?: boolean,
    logging?: LogOptions
};
