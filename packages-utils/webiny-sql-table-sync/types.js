import type { Table } from "webiny-sql-table";
import type { Log } from ".";

export type SyncOptions = {
    tables: Array<Table>,
    preview?: boolean,
    logClass?: Log
};

export type LogOptions = {
    tags: ?Array<string>,
    message: ?string,
    data: ?{}
};
