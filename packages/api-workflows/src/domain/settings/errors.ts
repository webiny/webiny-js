import { BaseError } from "@webiny/feature/api";
import type { PersistenceErrorSource } from "~/domain/PersistenceErrorSource.js";

export interface WorkflowSettingsValidationErrorData {
    userId: string;
}

export class WorkflowSettingsValidationError extends BaseError<WorkflowSettingsValidationErrorData> {
    override readonly code = "Workflows/Settings/Validation" as const;

    constructor(message: string, data: WorkflowSettingsValidationErrorData) {
        super({ message, data });
    }
}

export interface WorkflowSettingsPersistenceErrorCause {
    code?: string;
    message: string;
}

export interface WorkflowSettingsPersistenceErrorData {
    cause: WorkflowSettingsPersistenceErrorCause;
}

export class WorkflowSettingsPersistenceError extends BaseError<WorkflowSettingsPersistenceErrorData> {
    override readonly code = "Workflows/Settings/Persistence" as const;

    constructor(error: PersistenceErrorSource) {
        super({
            message: error.message,
            data: { cause: { code: error.code, message: error.message } }
        });
    }
}
