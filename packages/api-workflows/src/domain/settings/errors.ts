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

/** The storage error's code only; its text stays on the server. */
export interface WorkflowSettingsPersistenceErrorCause {
    code?: string;
}

export interface WorkflowSettingsPersistenceErrorData {
    cause: WorkflowSettingsPersistenceErrorCause;
}

export class WorkflowSettingsPersistenceError extends BaseError<WorkflowSettingsPersistenceErrorData> {
    override readonly code = "Workflows/Settings/Persistence" as const;
    /** The raw storage error, for server logs only; never sent to a client (R146). */
    declare public readonly source: PersistenceErrorSource;

    constructor(error: PersistenceErrorSource) {
        super({
            message: "The workflow settings could not be read or saved.",
            data: { cause: { code: error.code } }
        });
        // Not enumerable: serialising the error never includes it.
        Object.defineProperty(this, "source", { value: error, enumerable: false });
    }
}
