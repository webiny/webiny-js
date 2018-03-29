// @flow
import { Sync, ConsoleLog } from "webiny-sql-table-sync";
import { PageTable, CategoryTable, RevisionTable } from "webiny-api-cms/lib/mysql";

import { MySQLTable } from "webiny-api";

// Configure MySQLTable driver
import { connection } from "./../../configs/database";

MySQLTable.getDriver().setConnection(connection);

(async () => {
    const tables = [PageTable, CategoryTable, RevisionTable];

    const sync = new Sync({
        tables,
        drop: true,
        logClass: ConsoleLog
    });
    await sync.execute();

    const { default: importer } = await import("./import");
    return importer();
})();
