import type { GenericRecord } from "@webiny/api/types.js";

export interface IAuditLogCreatedBy {
    id: string;
    type: string;
    displayName: string;
}

export interface IAuditLog {
    id: string;
    tenant: string;
    createdBy: IAuditLogCreatedBy;
    createdOn: Date;
    app: string;
    action: string;
    title: string;
    message: string;
    targetId: string;
    content: string;
    tags: string[];
}

export interface IStorageAuditLog extends Omit<IAuditLog, "createdOn"> {
    createdOn: string;
}
