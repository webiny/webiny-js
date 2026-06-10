import type { Knex } from "knex";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { SqliteStorage } from "~/SqliteStorage.js";
import { AuditLogsStorage } from "@webiny/api-audit-logs/abstractions.js";

interface RegisterAuditLogsSqlStorageOperationsParams {
    knex: Knex;
}

export const registerAuditLogsSqlStorageOperations = (
    params: RegisterAuditLogsSqlStorageOperationsParams
) => {
    return createRegisterExtensionPlugin(context => {
        const storage = new SqliteStorage({ knex: params.knex });
        context.container.registerInstance(AuditLogsStorage, storage);
    });
};
