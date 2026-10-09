import { BaseError } from "@webiny/feature/api";
import type { PersistenceErrorSource } from "~/domain/PersistenceErrorSource.js";

export interface AssignmentPersistenceErrorCause {
    code?: string;
    message: string;
}

export interface AssignmentPersistenceErrorData {
    cause: AssignmentPersistenceErrorCause;
}

export class AssignmentPersistenceError extends BaseError<AssignmentPersistenceErrorData> {
    override readonly code = "Workflows/Assignment/Persistence" as const;

    constructor(error: PersistenceErrorSource) {
        super({
            message: error.message,
            data: { cause: { code: error.code, message: error.message } }
        });
    }
}
