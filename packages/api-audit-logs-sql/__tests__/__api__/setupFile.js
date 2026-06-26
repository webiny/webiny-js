import { setStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { registerAuditLogsSqlStorageOperations } from "../../src/index.js";

setStorageOps("auditLogs", () => {
    const knex = global.__testKnex;
    if (!knex) {
        throw new Error(
            "No global.__testKnex found. Audit Logs SQL presets require a knex instance from another SQL preset (e.g. api-headless-cms-sql)."
        );
    }

    return {
        storageOperations: {},
        plugins: [registerAuditLogsSqlStorageOperations({ knex })]
    };
});
