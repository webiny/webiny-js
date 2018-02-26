import type { Table } from "webiny-sql-table";
import type { Log } from ".";

export type SyncOptions = {
    tables: Array<Table>,
    execute?: boolean,
    logClass?: Log
};

export type LogType = "success" | "info" | "warning" | "error";
