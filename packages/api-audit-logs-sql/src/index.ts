import type { Knex } from "knex";
import { TableManager } from "@webiny/api-core-sql/TableManager.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { SqliteStorage } from "~/SqliteStorage.js";
import { AuditLogsStorage } from "@webiny/api-audit-logs/abstractions.js";

interface RegisterAuditLogsSqlStorageOperationsParams {
    knex: Knex;
    tableNamePrefix?: string;
    /** The schema was set up before the API took traffic: no table checks at runtime. */
    schemaManaged?: boolean;
}

export const registerAuditLogsSqlStorageOperations = (
    params: RegisterAuditLogsSqlStorageOperationsParams
) => {
    return createRegisterExtensionPlugin(context => {
        const tableManager = new TableManager(params.knex, params.tableNamePrefix, {
            schemaManaged: params.schemaManaged
        });
        const storage = new SqliteStorage({
            knex: params.knex,
            tableManager
        });
        context.container.registerInstance(AuditLogsStorage, storage);
    });
};
