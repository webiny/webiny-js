import type { GenericRecord } from "@webiny/api/types.js";
import type { Action, App, Entity } from "@webiny/common-audit-logs/types.js";
import type { DbContext } from "@webiny/handler-db/types.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import type { IAuditLog } from "~/storage/types.js";
import type { IStorageListParams } from "~/storage/abstractions/Storage.js";

export interface AuditLogPayload
    extends Omit<IAuditLog, "id" | "tenant" | "createdOn" | "createdBy" | "expiresAt" | "content"> {
    content: GenericRecord;
}

export interface IListAuditLogsParams extends Omit<IStorageListParams, "tenant" | "limit" | "app"> {
    app?: string;
    limit?: number;
}

export interface IListAuditLogsResultMeta {
    cursor: string | null;
    hasMoreItems: boolean;
}

export interface IListAuditLogsSuccessResult {
    items: IAuditLog[];
    meta: IListAuditLogsResultMeta;
    error?: never;
}

export interface IListAuditLogsErrorResult {
    items?: never;
    meta?: never;
    error: Error;
}

export type IListAuditLogsResult = IListAuditLogsSuccessResult | IListAuditLogsErrorResult;

export interface AuditLogsContextValue {
    deleteLogsAfterDays: number | undefined;
    createAuditLog(payload: AuditLogPayload): Promise<IAuditLog>;
    updateAuditLog(original: IAuditLog, payload: Partial<AuditLogPayload>): Promise<IAuditLog>;
    getAuditLog(id: string): Promise<IAuditLog | null>;
    listAuditLogs(params: IListAuditLogsParams): Promise<IListAuditLogsResult>;
}

export interface AuditLogsContext extends ApiCoreContext, Pick<DbContext, "db"> {
    auditLogs: AuditLogsContextValue;
}

export interface AuditObject {
    [app: string]: EntityObject;
}

export interface EntityObject {
    [entity: string]: ActionObject;
}

export interface ActionObject {
    [action: string]: AuditAction;
}

export interface AuditAction {
    app: App;
    entity: Entity;
    action: Action;
}
