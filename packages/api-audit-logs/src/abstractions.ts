import { createAbstraction } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import type { AuditAction } from "~/types.js";
import type { AuditLogPayload } from "~/types.js";
import type { IListAuditLogsParams } from "~/types.js";
import type { IListAuditLogsResult } from "~/types.js";
import type { IAuditLog } from "~/storage/types.js";
import type { IStorage } from "~/storage/abstractions/Storage.js";

/**
 * AuditLogs - Creates, updates, reads and lists the audit logs of the current tenant.
 */
export interface IAuditLogs {
    createAuditLog(payload: AuditLogPayload): Promise<IAuditLog>;
    updateAuditLog(original: IAuditLog, payload: Partial<AuditLogPayload>): Promise<IAuditLog>;
    getAuditLog(id: string): Promise<IAuditLog | null>;
    listAuditLogs(params: IListAuditLogsParams): Promise<IListAuditLogsResult>;
}

export const AuditLogs = createAbstraction<IAuditLogs>("AuditLogs");

export namespace AuditLogs {
    export type Interface = IAuditLogs;
}

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

/**
 * AuditLogRecorder - Records an audit log for something the current identity did.
 */
export interface IAuditLogRecorderParams {
    audit: AuditAction;
    message: string;
    content: GenericRecord;
    entityId: string;
}

export interface IAuditLogRecorder {
    record(params: IAuditLogRecorderParams): Promise<IAuditLog | null>;
}

export const AuditLogRecorder = createAbstraction<IAuditLogRecorder>("AuditLogRecorder");

export namespace AuditLogRecorder {
    export type Interface = IAuditLogRecorder;
    export type Params = IAuditLogRecorderParams;
}

export const AuditLogsStorage = createAbstraction<IStorage>("AuditLogsStorage");

export namespace AuditLogsStorage {
    export type Interface = IStorage;
}
