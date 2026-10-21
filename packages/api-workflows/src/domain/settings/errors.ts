import { BaseError } from "@webiny/feature/api";
import type { PersistenceErrorSource } from "~/domain/PersistenceErrorSource.js";
import { PersistenceError } from "~/domain/PersistenceError.js";

export interface WorkflowSettingsValidationErrorData {
    userId: string;
}

export class WorkflowSettingsValidationError extends BaseError<WorkflowSettingsValidationErrorData> {
    override readonly code = "Workflows/Settings/Validation" as const;

    constructor(message: string, data: WorkflowSettingsValidationErrorData) {
        super({ message, data });
    }
}

export class WorkflowSettingsPersistenceError extends PersistenceError {
    override readonly code = "Workflows/Settings/Persistence" as const;

    constructor(error: PersistenceErrorSource) {
        super("The workflow settings could not be read or saved.", error);
    }
}
