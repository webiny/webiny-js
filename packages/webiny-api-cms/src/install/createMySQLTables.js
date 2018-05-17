// @flow
import { Sync, ConsoleLog } from "webiny-sql-table-sync";
import { CategoryTable, PageTable, RevisionTable, WidgetTable } from "./tables";

export default async () => {
    const tables = [CategoryTable, PageTable, RevisionTable, WidgetTable];

    const sync = new Sync({
        tables,
        drop: true,
        logClass: ConsoleLog
    });
    await sync.execute();
};
