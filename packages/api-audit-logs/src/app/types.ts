import type { AcoContext, IAcoApp } from "@webiny/api-aco/types";
import type { Context as BaseContext } from "@webiny/handler/types";
import type { AuditLogValues } from "~/types.js";
import type { Topic } from "@webiny/pubsub/types.js";

export interface OnAuditLogBeforeCreateTopicParams {
    values: AuditLogValues;
    context: AcoContext;
    setValues(values: Partial<AuditLogValues>): void;
}
export interface OnAuditLogBeforeUpdateTopicParams {
    values: AuditLogValues;
    original: AuditLogValues;
    context: AcoContext;
    setValues(values: Partial<AuditLogValues>): void;
}
export interface OnAuditLogBeforeDeleteTopicParams {
    id: string;
    original: AuditLogValues;
    context: AcoContext;
}

export interface AuditLogsAcoContext extends BaseContext, AcoContext {
    auditLogsAco: {
        app: IAcoApp;
        onBeforeCreate: Topic<OnAuditLogBeforeCreateTopicParams>;
        onBeforeUpdate: Topic<OnAuditLogBeforeUpdateTopicParams>;
        onBeforeDelete: Topic<OnAuditLogBeforeDeleteTopicParams>;
    };
}
