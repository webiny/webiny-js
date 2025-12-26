import { BaseError } from "@webiny/feature/api";
import type { OutputErrors } from "@webiny/utils/createZodError.js";

export class SettingsNotFoundError extends BaseError {
    override readonly code = "FileManager/Settings/NotFoundError" as const;

    constructor() {
        super({
            message: "File manager settings not found."
        });
    }
}

export class SettingsUpdateError extends BaseError {
    override readonly code = "FileManager/Settings/UpdateError" as const;

    constructor(error: Error) {
        super({
            message: `Error updating settings: ${error.message}`
        });
    }
}

interface ValidationParams {
    invalidFields: OutputErrors;
}

export class SettingsValidationError extends BaseError<ValidationParams> {
    override readonly code = "FileManager/Settings/ValidationError" as const;

    constructor(invalidFields: OutputErrors) {
        super({
            message: "Validation failed.",
            data: { invalidFields }
        });
    }
}
