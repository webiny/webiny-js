import { BaseError } from "@webiny/feature/admin";
import type { OutputErrors } from "@webiny/utils/createZodError.js";

export class SettingsValidationError extends BaseError<{ invalidFields: OutputErrors }> {
    override readonly code = "AiPowerUps/Settings/ValidationError" as const;

    constructor(invalidFields: OutputErrors) {
        super({
            message: "Validation failed.",
            data: { invalidFields }
        });
    }
}

export class SettingsUpdateError extends BaseError {
    override readonly code = "AiPowerUps/Settings/UpdateError" as const;

    constructor(message: string) {
        super({ message });
    }
}
