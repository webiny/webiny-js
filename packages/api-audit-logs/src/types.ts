import type { SecurityContext } from "@webiny/api-security/types.js";
import type { Context as BaseContext } from "@webiny/handler/types.js";
import type { GenericRecord } from "@webiny/api/types.js";
import type { Topic } from "@webiny/pubsub/types.js";
import type { MailerContext } from "@webiny/api-mailer/types.js";
import type { TenancyContext } from "@webiny/api-tenancy/types.js";
import type { ApwContext } from "@webiny/api-apw/types.js";
import type { IAuditLog } from "~/storage/types.js";
import type { FileManagerContext } from "@webiny/api-file-manager/types.js";
import type { AcoContext } from "@webiny/api-aco/types.js";
import type { IStorageListParams } from "~/storage/abstractions/Storage.js";
import type { App, Entity, Action } from "@webiny/common-audit-logs/types.js";
import type { DbContext } from "@webiny/handler-db/types.js";
import type { AdminUsersContext } from "@webiny/api-admin-users/types.js";
import type { I18NContext } from "@webiny/api-i18n/types.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { WcpContext } from "@webiny/api-wcp/types.js";

export interface AuditLogPayload
    extends Omit<IAuditLog, "id" | "tenant" | "createdOn" | "createdBy" | "expiresAt" | "content"> {
    content: GenericRecord;
}

export interface OnAuditLogBeforeCreateTopicParams {
    auditLog: IAuditLog;
    context: AuditLogsContext;
    setAuditLog(auditLog: Partial<IAuditLog>): void;
}
export interface OnAuditLogBeforeUpdateTopicParams {
    auditLog: IAuditLog;
    original: IAuditLog;
    context: AuditLogsContext;
    setAuditLog(auditLog: Partial<IAuditLog>): void;
}

export interface IListAuditLogsParams extends Omit<IStorageListParams, "tenant" | "limit"> {
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
    onBeforeUpdate: Topic<OnAuditLogBeforeUpdateTopicParams>;

    createAuditLog(payload: AuditLogPayload): Promise<IAuditLog>;
    updateAuditLog(original: IAuditLog, payload: Partial<AuditLogPayload>): Promise<IAuditLog>;
    getAuditLog(id: string): Promise<IAuditLog | null>;
    listAuditLogs(params: IListAuditLogsParams): Promise<IListAuditLogsResult>;
}

export interface AuditLogsContext
    extends BaseContext,
        Pick<CmsContext, "cms">,
        Pick<WcpContext, "wcp">,
        Pick<AdminUsersContext, "adminUsers">,
        Pick<I18NContext, "i18n">,
        Pick<DbContext, "db">,
        Pick<AcoContext, "aco">,
        Pick<MailerContext, "mailer">,
        Pick<FileManagerContext, "fileManager">,
        Pick<SecurityContext, "security">,
        Pick<TenancyContext, "tenancy">,
        Pick<ApwContext, "apw"> {
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
