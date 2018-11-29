// @flow
import { Sync } from "webiny-sql-table-sync";
import { CategoryTable, PageTable, ElementTable, MenuTable, TagTable, Tags2Pages } from "./tables";

export default async () => {
    const tables = [CategoryTable, PageTable, MenuTable, ElementTable, TagTable, Tags2Pages];

    const sync = new Sync({
        tables,
        drop: true
    });
    await sync.execute();
};
