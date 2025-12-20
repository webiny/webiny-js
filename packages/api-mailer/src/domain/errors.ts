import { BaseError } from "@webiny/feature/api";
import type { ZodError } from "zod";

export class SettingsValidationError extends BaseError<{ errors: ZodError["errors"] }> {
    override readonly code = "Mailer/Settings/Validation" as const;

    constructor(errors: ZodError["errors"]) {
        super({
            message: "Settings validation failed.",
            data: {
                errors
            }
        });
    }
}

export class SettingsPersistenceError extends BaseError<{ error: Error }> {
    override readonly code = "Mailer/Settings/Persistence" as const;

    constructor(error: Error) {
        super({
            message: "Failed to persist settings.",
            data: {
                error
            }
        });
    }
}
