// @flow
import UserTable from "./tables/User.mysql";
import RoleTable from "./tables/Role.mysql";
import RoleGroupTable from "./tables/RoleGroup.mysql";
import PermissionTable from "./tables/Permission.mysql";
import Role2PermissionTable from "./tables/Role2Permission.mysql";
import Role2RoleGroupTable from "./tables/Role2RoleGroup.mysql";
import Identity2RoleTable from "./tables/Identity2Role.mysql";
import Identity2RoleGroupTable from "./tables/Identity2RoleGroup.mysql";
import MySQLTable from "./MySQLTable";

(async () => {
    const tables = [
        new UserTable(),
        new RoleTable(),
        new RoleGroupTable(),
        new PermissionTable(),
        new Role2PermissionTable(),
        new Role2RoleGroupTable(),
        new Identity2RoleTable(),
        new Identity2RoleGroupTable()
    ];

    for (let i = 0; i < tables.length; i++) {
        const table: MySQLTable = tables[i];

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
