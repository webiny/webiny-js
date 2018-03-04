// @flow
import UserTable from "./tables/user.mysql";
import { PermissionTable, RoleTable, Identity2RoleTable } from "webiny-api-security";

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
    const tables = [
        new Identity2RoleTable(),
        new RoleTable(),
        new PermissionTable(),
        new UserTable()
    ];

    for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        try {
            await table.drop();
        } catch (e) {
            // Nothing to drop...
        }

        try {
            await table.create();
        } catch (e) {
            console.log(e.message);
        }
    }

    return import("./import")
        .then(({ default: importer }) => {
            return importer();
        })
        .then(() => {
            process.exit(0);
        });
})();
