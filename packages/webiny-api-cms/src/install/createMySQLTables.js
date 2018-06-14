// @flow
import { Sync } from "webiny-sql-table-sync";
import { CategoryTable, PageTable, RevisionTable, WidgetTable, WidgetPresetTable } from "./tables";

export default async () => {
    const tables = [CategoryTable, PageTable, RevisionTable, WidgetTable, WidgetPresetTable];

    const sync = new Sync({
        tables,
        drop: true
    });
    await sync.execute();
};
