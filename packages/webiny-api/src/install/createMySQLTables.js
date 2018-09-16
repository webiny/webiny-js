// @flow
import { Sync, ConsoleLog } from "webiny-sql-table-sync";
import {
    ApiTokenTable,
    FileTable,
    Groups2Entities,
    Policies2Entities,
    GroupTable,
    PolicyTable,
    SettingsTable,
    UserTable
} from "./tables";

export default async () => {
    const tables = [
        ApiTokenTable,
        FileTable,
        Groups2Entities,
        Policies2Entities,
        GroupTable,
        PolicyTable,
        SettingsTable,
        UserTable
    ];

    const sync = new Sync({
        tables,
        drop: true,
        logClass: ConsoleLog
    });
    await sync.execute();
};
