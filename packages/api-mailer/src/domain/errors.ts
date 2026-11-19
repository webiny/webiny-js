import { BaseError } from "@webiny/feature/api";
import type { ZodError } from "zod";

export class MailValidationError extends BaseError<{ errors: ZodError["issues"] }> {
    override readonly code = "Mailer/SendMail/Validation" as const;

    constructor(errors: ZodError["issues"]) {
        super({
            message: "Email params are invalid.",
            data: {
                errors
            }
        });
    }
}

export class TestMailNotAuthorized extends BaseError {
    override readonly code = "Mailer/SendTestMail/NotAuthorized" as const;

    constructor() {
        super({ message: "Not allowed to send a test email." });
    }
}

export class TestMailNotConfigured extends BaseError {
    override readonly code = "Mailer/SendTestMail/NotConfigured" as const;

    constructor() {
        super({
            message: "No mail transport is configured, so there is nothing to test."
        });
    }
}
