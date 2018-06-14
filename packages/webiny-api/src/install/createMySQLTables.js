// @flow
import { Sync } from "webiny-sql-table-sync";
import {
    ApiTokenTable,
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
        ApiTokenTable,
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
        drop: true
    });
    await sync.execute();
};
