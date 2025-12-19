import type { GenericRecord } from "@webiny/api/types.js";
import type { Topic } from "@webiny/pubsub/types.js";
import type { MailerContext } from "@webiny/api-mailer/types.js";
import type { IAuditLog } from "~/storage/types.js";
import type { AcoContext } from "@webiny/api-aco/types.js";
import type { IStorageListParams } from "~/storage/abstractions/Storage.js";
import type { Action, App, Entity } from "@webiny/common-audit-logs/types.js";
import type { DbContext } from "@webiny/handler-db/types.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";

export interface AuditLogPayload
    extends Omit<IAuditLog, "id" | "tenant" | "createdOn" | "createdBy" | "expiresAt" | "content"> {
    content: GenericRecord;
}

export interface OnAuditLogBeforeCreateTopicParams {
    readonly auditLog: IAuditLog;
    context: AuditLogsContext;
    setAuditLog(auditLog: Partial<IAuditLog>): void;
}
export interface OnAuditLogAfterCreateTopicParams {
    readonly auditLog: IAuditLog;
    context: AuditLogsContext;
}
export interface OnAuditLogBeforeUpdateTopicParams {
    readonly auditLog: IAuditLog;
    readonly original: IAuditLog;
    context: AuditLogsContext;
    setAuditLog(auditLog: Partial<IAuditLog>): void;
}
export interface OnAuditLogAfterUpdateTopicParams {
    readonly auditLog: IAuditLog;
    readonly original: IAuditLog;
    context: AuditLogsContext;
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
    onBeforeCreate: Topic<OnAuditLogBeforeCreateTopicParams>;
    onAfterCreate: Topic<OnAuditLogAfterCreateTopicParams>;
    onBeforeUpdate: Topic<OnAuditLogBeforeUpdateTopicParams>;
    onAfterUpdate: Topic<OnAuditLogAfterUpdateTopicParams>;

    createAuditLog(payload: AuditLogPayload): Promise<IAuditLog>;
    updateAuditLog(original: IAuditLog, payload: Partial<AuditLogPayload>): Promise<IAuditLog>;
    getAuditLog(id: string): Promise<IAuditLog | null>;
    listAuditLogs(params: IListAuditLogsParams): Promise<IListAuditLogsResult>;
}

export interface AuditLogsContext
    extends ApiCoreContext,
        Pick<CmsContext, "cms">,
        Pick<DbContext, "db">,
        Pick<AcoContext, "aco">,
        Pick<MailerContext, "mailer"> {
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

// export type AuditLogType = "AuditLogs";

// export interface AuditLogValuesData extends GenericRecord {
//     data: string;
// }

// export interface AuditLogValues {
//     id: string;
//     title: string;
//     content: string;
//     tags: string[];
//     type: AuditLogType;
//     location: {
//         folderId: string;
//     };
//     data: AuditLogValuesData;
// }
