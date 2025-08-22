export interface IStorageAuditLogCreatedBy {
    id: string;
    type: string;
    displayName: string;
}

export interface IStorageAuditLog {
    id: string;
    tenant: string;
    createdBy: IStorageAuditLogCreatedBy;
    createdOn: Date;
    targetId: string;
    targetEntityId: string;
}
