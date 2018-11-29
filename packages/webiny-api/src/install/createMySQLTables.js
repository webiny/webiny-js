// @flow
import MySQLTable from "./tables/mysqlTable";
import type { MySQLDriver } from "webiny-sql-table-mysql";
import { Sync } from "webiny-sql-table-sync";
import {
    ApiTokenTable,
    GroupTable,
    Groups2EntitiesTable,
    Roles2EntitiesTable,
    RoleTable,
    SettingsTable,
    UserTable
} from "./tables";

export default async (config: Object) => {
    const driver: MySQLDriver = (MySQLTable.getDriver(): any);
    driver.setConnection(config.entity.driver.getConnection());

    const tables = [
        UserTable,
        ApiTokenTable,
        GroupTable,
        RoleTable,
        SettingsTable,
        Groups2EntitiesTable,
        Roles2EntitiesTable
    ];

    const sync = new Sync({
        tables,
        drop: true
    });
    await sync.execute();
};
