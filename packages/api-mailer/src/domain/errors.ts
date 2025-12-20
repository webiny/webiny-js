import { BaseError } from "@webiny/feature/api";
import type { ZodError } from "zod";

export class MailValidationError extends BaseError<{ errors: ZodError["errors"] }> {
    override readonly code = "Mailer/SendMail/Validation" as const;

    constructor(errors: ZodError["errors"]) {
        super({
            message: "Email params are invalid.",
            data: {
                errors
            }
        });
    }
}

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

export class SettingsNotAuthorized extends BaseError {
    override readonly code = "Mailer/Settings/NotAuthorized" as const;

    constructor() {
        super({ message: "Not allowed to update the mailer settings." });
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
