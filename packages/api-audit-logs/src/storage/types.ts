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
    message: string;
    entity: string;
    entityId: string;
    tags: string[];
    expiresAt: Date;
    content: string;
}
