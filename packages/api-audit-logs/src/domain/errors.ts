import { BaseError } from "@webiny/feature/api";

export class AuditLogPersistenceError extends BaseError {
    override readonly code = "AuditLogs/AuditLog/PersistenceError" as const;

    constructor(error: Error) {
        super({
            message: error.message
        });
    }
}
