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

export interface AuditLog {
    id: string;
    message: string;
    app: string;
    entity: string;
    entityId: string;
    action: ActionType;
    data: string;
    timestamp: Date;
    initiator: string;
}

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    group?: {
        name: string;
    };
}
