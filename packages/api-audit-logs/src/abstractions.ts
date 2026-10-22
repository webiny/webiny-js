import { createAbstraction } from "@webiny/feature/api";
import type { IStorage } from "~/storage/abstractions/Storage.js";

/**
 * AuditLogsConfig - How many days audit logs are kept before they expire.
 */
export interface IAuditLogsConfig {
    deleteLogsAfterDays: number;
}

export const AuditLogsConfig = createAbstraction<IAuditLogsConfig>("AuditLogsConfig");

export namespace AuditLogsConfig {
    export type Interface = IAuditLogsConfig;
}

export const AuditLogsStorage = createAbstraction<IStorage>("AuditLogsStorage");

export namespace AuditLogsStorage {
    export type Interface = IStorage;
}
