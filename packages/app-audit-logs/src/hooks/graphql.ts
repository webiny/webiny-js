export interface IListAuditLogsVariablesWhere {
    app?: string;
    action?: string;
    createdBy?: string;
    entity?: string;
    entityId?: string;
    createdOn_gte?: Date;
    createdOn_lte?: Date;
}
