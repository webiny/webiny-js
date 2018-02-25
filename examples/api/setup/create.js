// @flow
import UserTable from "./tables/user.mysql";
import PermissionTable from "webiny-api-security/src/entities/mysql/permission.mysql";
import RoleTable from "webiny-api-security/src/entities/mysql/role.mysql";

/*
import RoleGroupTable from "webiny-api-security/src/entities/mysql/roleGroup.mysql";
import Role2PermissionTable from "webiny-api-security/src/entities/mysql/role2Permission.mysql";
import Role2RoleGroupTable from "webiny-api-security/src/entities/mysql/role2RoleGroup.mysql";
import Identity2RoleTable from "webiny-api-security/src/entities/mysql/identity2Role.mysql";
import Identity2RoleGroupTable from "webiny-api-security/src/entities/mysql/identity2RoleGroup.mysql";*/

// Configure MySQLTable driver
import { connection } from "../connection";
import { MySQLTable } from "webiny-api";

MySQLTable.getDriver().setConnection(connection);

(async () => {
    const tables = [new UserTable(), new PermissionTable(), new RoleTable()];

    for (let i = 0; i < tables.length; i++) {
        const table = tables[i];

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
