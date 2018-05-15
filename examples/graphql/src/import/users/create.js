// @flow
import { Sync, ConsoleLog } from "webiny-sql-table-sync";
import { UserTable, GroupTable } from "webiny-api-security/lib/mysql";

import { SettingsTable, FileTable, ImageTable } from "webiny-api/lib/mysql";

import { MySQLTable } from "webiny-api/lib";

// Configure MySQLTable driver
import { connection } from "./../../configs/database";

MySQLTable.getDriver().setConnection(connection);

(async () => {
    const tables = [UserTable, GroupTable, SettingsTable, FileTable, ImageTable];

    const sync = new Sync({
        tables,
        drop: true,
        logClass: ConsoleLog
    });
    await sync.execute();

    const { default: importer } = await import("./import");
    return importer();
})();
