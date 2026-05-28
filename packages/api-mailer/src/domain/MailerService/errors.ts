import { BaseError } from "@webiny/feature/api";
import type { TransportSendResponse } from "~/types.js";

export class NoTransportAvailableError extends BaseError {
    override readonly code = "Mailer/MailerService/NoTransportAvailable" as const;

    constructor() {
        super({
            message: "There is no transport available."
        });
    }
}

export class NoSettingsConfiguredError extends BaseError {
    override readonly code = "Mailer/MailerService/NoSettingsConfigured" as const;

    constructor() {
        super({
            message: "No mailer settings are configured and no environment variables are set."
        });
    }
}

export class TransportCreateError extends BaseError {
    override readonly code = "Mailer/MailerService/TransportCreateError" as const;

    constructor(error: unknown) {
        super({
            message: error instanceof Error ? error.message : String(error)
        });
    }
}

export class TransportSendError extends BaseError<{ error: TransportSendResponse["error"] }> {
    override readonly code = "Mailer/MailerService/TransportSendError" as const;

    constructor(error: NonNullable<TransportSendResponse["error"]>) {
        super({
            message: error.message,
            data: {
                error
            }
        });
    }
}
