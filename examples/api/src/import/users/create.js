// @flow
import { Sync, ConsoleLog } from "webiny-sql-table-sync";
import {
    UserTable,
    PermissionTable,
    RoleTable,
    RoleGroupTable,
    Identity2RoleTable,
    Identity2RoleGroupTable,
    Role2RoleGroupTable,
    Role2PermissionTable
} from "webiny-api-security/lib/mysql";
import { MySQLTable } from "webiny-api";

// Configure MySQLTable driver
import { connection } from "./../../configs/database";

MySQLTable.getDriver().setConnection(connection);

(async () => {
    const tables = [
        UserTable,
        Identity2RoleTable,
        RoleTable,
        PermissionTable,
        Role2PermissionTable,
        RoleGroupTable,
        Identity2RoleGroupTable,
        Role2RoleGroupTable
    ];

    const sync = new Sync({
        tables,
        drop: true,
        logClass: ConsoleLog
    });
    await sync.execute();

    const { default: importer } = await import("./import");
    return importer();
})();
