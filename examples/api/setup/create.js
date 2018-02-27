// @flow
import { Sync, ConsoleLog } from "webiny-sql-table-sync";
import UserTable from "./tables/user.mysql";
import PermissionTable from "webiny-api-security/src/entities/mysql/permission.mysql";
import RoleTable from "webiny-api-security/src/entities/mysql/role.mysql";
import Identity2RoleTable from "webiny-api-security/src/entities/mysql/identity2Role.mysql";

/*
import RoleGroupTable from "webiny-api-security/src/entities/mysql/roleGroup.mysql";
import Role2PermissionTable from "webiny-api-security/src/entities/mysql/role2Permission.mysql";
import Role2RoleGroupTable from "webiny-api-security/src/entities/mysql/role2RoleGroup.mysql";
import Identity2RoleGroupTable from "webiny-api-security/src/entities/mysql/identity2RoleGroup.mysql";*/

// Configure MySQLTable driver
import { connection } from "../connection";
import { MySQLTable } from "webiny-api";

MySQLTable.getDriver().setConnection(connection);

(async () => {
    const tables = [Identity2RoleTable, RoleTable, PermissionTable, UserTable];

    const sync = new Sync({
        tables,
        drop: true,
        logClass: ConsoleLog
    });
    await sync.execute();

    return import("./import")
        .then(({ default: importer }) => {
            return importer();
        })
        .then(() => {
            process.exit(0);
        });
})();
