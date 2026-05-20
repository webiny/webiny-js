import { BaseError } from "@webiny/feature/api";
import type { OutputErrors } from "@webiny/utils/createZodError.js";

interface ValidationParams {
    invalidFields: OutputErrors;
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
