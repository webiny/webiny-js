export interface AuditLog {
    id: string;
    message: string;
    app: string;
    entity: string;
    entityId: string;
    action: string;
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
