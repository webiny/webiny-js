import { createFeature } from "@webiny/feature/api";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { SqlAuditLogsStorage } from "~/SqlAuditLogsStorage.js";
import { AuditLogsSqlSchemaSetup } from "~/AuditLogsSqlSchemaSetup.js";

/**
 * The SQL audit logs storage and its `auditLogs` schema setup step. Registered per request, it runs
 * on the connection (`KnexClient`) and the table settings (`SqlSchemaConfig`) the SQL storage keeps
 * in the root.
 */
export const AuditLogsSqlFeature = createFeature({
    name: "AuditLogsSql",
    register(container) {
        container.register(SqlAuditLogsStorage);
        container.register(AuditLogsSqlSchemaSetup);
    }
});

/** `AuditLogsSqlFeature` as an extension plugin, for setups that register storages that way. */
export const registerAuditLogsSqlStorageOperations = () => {
    return createRegisterExtensionPlugin(context => {
        AuditLogsSqlFeature.register(context.container);
    });
};
