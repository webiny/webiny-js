import type { Knex } from "knex";
import { TableManager } from "@webiny/api-core-sql/TableManager.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { SqliteStorage } from "~/SqliteStorage.js";
import { AuditLogsStorage } from "@webiny/api-audit-logs/abstractions.js";

interface RegisterAuditLogsSqlStorageOperationsParams {
    knex: Knex;
    tableNamePrefix?: string;
}

export const registerAuditLogsSqlStorageOperations = (
    params: RegisterAuditLogsSqlStorageOperationsParams
) => {
    return createRegisterExtensionPlugin(context => {
        const tableManager = new TableManager(params.knex, params.tableNamePrefix);
        const storage = new SqliteStorage({
            knex: params.knex,
            tableManager
        });
        context.container.registerInstance(AuditLogsStorage, storage);
    });
};
