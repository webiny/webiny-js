// @flow
import { Sync, ConsoleLog } from "webiny-sql-table-sync";
import { CategoryTable, PageTable, ElementTable, MenuTable, TagTable } from "./tables";

export default async () => {
    const tables = [CategoryTable, PageTable, MenuTable, ElementTable, TagTable];

    const sync = new Sync({
        tables,
        drop: true,
        logClass: ConsoleLog
    });
    await sync.execute();
};
