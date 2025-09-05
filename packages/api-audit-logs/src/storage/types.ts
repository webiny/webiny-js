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

export interface IStorageAuditLog extends Omit<IAuditLog, "createdOn" | "content" | "expiresAt"> {
    expiresAt: string;
    createdOn: string;
    content: string;
}

export interface IStorageItem {
    PK: string;
    SK: string;
    GSI1_PK: string;
    GSI1_SK: number;
    GSI2_PK: string;
    GSI2_SK: number;
    GSI3_PK: string;
    GSI3_SK: number;
    GSI4_PK: string;
    GSI4_SK: number;
    GSI5_PK: string;
    GSI5_SK: number;

    data: IStorageAuditLog;
    expiresAt: number;
}
