// @flow
import { Sync, ConsoleLog } from "webiny-sql-table-sync";
import {
    /*    CategoryTable,
    PageTable,
    RevisionTable,
    WidgetTable,
    LayoutTable,*/
    WidgetPresetTable
} from "./tables";

export default async () => {
    const tables = [
        /*CategoryTable,
        LayoutTable,
        PageTable,
        RevisionTable,
        WidgetTable,*/
        WidgetPresetTable
    ];

    const sync = new Sync({
        tables,
        drop: true,
        logClass: ConsoleLog
    });
    await sync.execute();
};
