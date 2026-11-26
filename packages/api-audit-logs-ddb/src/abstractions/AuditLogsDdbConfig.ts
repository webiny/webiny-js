import { createAbstraction } from "@webiny/feature/api";

export interface IAuditLogsDdbConfig {
    /** Falls back to the entity's own default (`DB_TABLE_AUDIT_LOGS`). */
    tableName?: string;
}

export const AuditLogsDdbConfig = createAbstraction<IAuditLogsDdbConfig>("AuditLogsDdbConfig");

export namespace AuditLogsDdbConfig {
    export type Interface = IAuditLogsDdbConfig;
}
