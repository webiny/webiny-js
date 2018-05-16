// @flow
import { Sync, ConsoleLog } from "webiny-sql-table-sync";
import { FileTable, GroupTable, ImageTable, SettingsTable, UserTable } from "./mysql";
import { MySQLTable } from "./..";
import { connection } from "./database";

MySQLTable.getDriver().setConnection(connection);

export default async () => {
    const tables = [FileTable, GroupTable, ImageTable, SettingsTable, UserTable];

    const sync = new Sync({
        tables,
        drop: true,
        logClass: ConsoleLog
    });
    await sync.execute();
};
