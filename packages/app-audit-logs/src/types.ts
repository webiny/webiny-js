import type { GenericRecord } from "@webiny/app/types.js";

export enum ActionType {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    MOVE_TO_TRASH = "MOVE_TO_TRASH",
    RESTORE_FROM_TRASH = "RESTORE_FROM_TRASH",
    PUBLISH = "PUBLISH",
    UNPUBLISH = "UNPUBLISH",
    IMPORT = "IMPORT",
    EXPORT = "EXPORT"
}

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    groups?: {
        name: string;
    }[];
}

export interface IAuditLogCreatedByRaw {
    id: string;
    displayName?: string;
    type?: string;
}

export interface IAuditLogCreatedBy extends IAuditLogCreatedByRaw {
    role: string;
}

export interface IAuditLogRaw {
    id: string;
    createdBy: IAuditLogCreatedByRaw;
    createdOn: Date;
    app: string;
    action: ActionType;
    message: string;
    entity: string;
    entityId: string;
    tags: string[];
    expiresAt?: Date;
    content: string;
}

export interface IAuditLogEntity {
    value: string;
    label: string;
    link?: string;
}

export interface IAuditLogAction {
    value: ActionType;
    label: string;
}

export interface IAuditLog extends Omit<IAuditLogRaw, "entity" | "action" | "createdBy"> {
    entity: IAuditLogEntity;
    action: IAuditLogAction;
    createdBy: IAuditLogCreatedBy;
}

export interface IAuditLogsMeta {
    hasMoreItems: boolean;
    cursor: string | null;
}

export interface IAuditLogsError {
    message: string;
    code: string;
    data?: GenericRecord;
    stack?: string;
}
