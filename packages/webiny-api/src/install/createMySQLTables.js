// @flow
import { Sync, ConsoleLog } from "webiny-sql-table-sync";
import {
    Entities2Groups,
    FileTable,
    GroupTable,
    ImageTable,
    SettingsTable,
    UserTable
} from "./tables";

export default async () => {
    const tables = [Entities2Groups, FileTable, GroupTable, ImageTable, SettingsTable, UserTable];

    const sync = new Sync({
        tables,
        drop: true,
        logClass: ConsoleLog
    });
    await sync.execute();
};
