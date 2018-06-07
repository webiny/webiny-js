// @flow
import { Sync, ConsoleLog } from "webiny-sql-table-sync";
import {
    Groups2Entities,
    Policies2Entities,
    FileTable,
    GroupTable,
    ImageTable,
    PolicyTable,
    SettingsTable,
    UserTable
} from "./tables";

export default async () => {
    const tables = [
        Groups2Entities,
        Policies2Entities,
        FileTable,
        GroupTable,
        ImageTable,
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
