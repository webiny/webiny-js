// @flow
import { Sync, ConsoleLog } from "webiny-sql-table-sync";
import { CategoryTable, PageTable } from "./tables";

export default async () => {
    const tables = [CategoryTable, PageTable];

    const sync = new Sync({
        tables,
        drop: true,
        logClass: ConsoleLog
    });
    await sync.execute();
};
