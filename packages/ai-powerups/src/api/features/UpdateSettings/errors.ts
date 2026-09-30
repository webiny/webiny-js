import { BaseError } from "@webiny/feature/api";
import type { OutputErrors } from "@webiny/utils/createZodError.js";

interface ValidationParams {
    invalidFields: OutputErrors;
}

export class SettingsNotAuthorizedError extends BaseError {
    override readonly code = "AiPowerUps/Settings/NotAuthorized" as const;

    constructor() {
        super({ message: "Not authorized to update AI Power-Ups settings." });
    }
}

export class SettingsValidationError extends BaseError<ValidationParams> {
    override readonly code = "AiPowerUps/Settings/ValidationError" as const;

    constructor(invalidFields: OutputErrors) {
        super({
            message: "Validation failed.",
            data: { invalidFields }
        });
    }
}
