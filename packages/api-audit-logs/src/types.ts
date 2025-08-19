import type { AcoContext } from "@webiny/api-aco/types";
import type { MailerContext } from "@webiny/api-mailer/types";
import type { SecurityContext } from "@webiny/api-security/types";
import type { ApwContext } from "@webiny/api-apw/types";
import type { Context as BaseContext } from "@webiny/handler/types";
import type { ICmsEntryLocation } from "@webiny/api-headless-cms/types/index.js";
import { GenericRecord } from "@webiny/api/types";

export * from "~/app/types";

export interface Action {
    type: string;
    displayName: string;
    /**
     * Delay in seconds before a new audit log can be created.
     * During this delay actions will update existing audit log instead of creating new ones.
     */
    newEntryDelay?: number;
}

export interface Entity {
    type: string;
    displayName: string;
    linkToEntity?: (id: string) => string;
    actions: Action[];
}

export interface App {
    app: string;
    displayName: string;
    entities: Entity[];
}

export interface AuditLog {
    id: string;
    message: string;
    app: string;
    entity: string;
    entityId: string;
    action: string;
    data: JSON;
    timestamp: Date;
    initiator: string;
}

export interface AuditLogsContext
    extends BaseContext,
        AcoContext,
        MailerContext,
        SecurityContext,
        ApwContext {}

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

export type AuditLogType = "AuditLogs";

export interface AuditLogValuesData extends GenericRecord {
    data: GenericRecord;
}

export interface AuditLogValues {
    id: string;
    title: string;
    content: string;
    tags: string[];
    type: AuditLogType;
    location: ICmsEntryLocation;
    data: AuditLogValuesData;
}
