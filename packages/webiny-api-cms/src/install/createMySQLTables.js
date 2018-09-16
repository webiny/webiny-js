// @flow
import { Sync } from "webiny-sql-table-sync";
import { CategoryTable } from "./tables";

export default async () => {
    const tables = [CategoryTable];

    const sync = new Sync({
        tables,
        drop: true
    });
    await sync.execute();
};
