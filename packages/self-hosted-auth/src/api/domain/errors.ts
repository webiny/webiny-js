import { BaseError } from "@webiny/feature/api";

/**
 * Deliberately generic: we never reveal whether it was the email or the
 * password that was wrong, to avoid leaking which accounts exist.
 */
export class InvalidCredentialsError extends BaseError {
    override readonly code = "INVALID_CREDENTIALS" as const;

    constructor() {
        super({ message: "Invalid credentials." });
    }
}

export class CredentialNotFoundError extends BaseError<{ userId: string }> {
    override readonly code = "CREDENTIAL_NOT_FOUND" as const;

    constructor(userId: string) {
        super({ message: "Credential not found.", data: { userId } });
    }
}

export class NotAuthorizedError extends BaseError {
    override readonly code = "NOT_AUTHORIZED" as const;

    constructor() {
        super({ message: "Not authorized." });
    }
}

/**
 * The CLI reset token did not verify: bad signature, wrong issuer or audience, expired, or
 * malformed. Intentionally undifferentiated: the caller cannot act on the distinction, and
 * spelling it out would only help someone probing the endpoint.
 */
export class InvalidResetTokenError extends BaseError {
    override readonly code = "INVALID_RESET_TOKEN" as const;

    constructor() {
        super({ message: "The password reset token is invalid or has expired." });
    }
}

/**
 * No credential exists for the given email. Unlike login, this is safe to state plainly: the
 * caller already proved possession of the signing secret, so it learns nothing it could not
 * learn anyway, and an operator resetting a password needs to know they typed the wrong address.
 */
export class CredentialNotFoundForEmailError extends BaseError<{ email: string }> {
    override readonly code = "CREDENTIAL_NOT_FOUND_FOR_EMAIL" as const;

    constructor(email: string) {
        super({ message: `No credential found for "${email}".`, data: { email } });
    }
}

/**
 * The emailed reset code did not check out: wrong, already spent, expired, out of attempts, or
 * never issued for that address. Undifferentiated on purpose, like `InvalidResetTokenError`. The
 * user can only do one thing about any of them, which is ask for another code, and spelling out
 * which one it was would answer questions for someone working through a list of addresses.
 */
export class InvalidResetCodeError extends BaseError {
    override readonly code = "INVALID_RESET_CODE" as const;

    constructor() {
        super({ message: "The password reset code is invalid or has expired." });
    }
}

/**
 * The project has no mail transport configured, so no code can be delivered to anybody. Reported
 * before the account is looked up and worded the same either way, so it says nothing about whether
 * the address exists. It names the CLI command because this is the exact situation that command was
 * built for: a locked-out administrator on an installation where mail was never set up.
 */
export class MailerNotConfiguredError extends BaseError {
    override readonly code = "MAILER_NOT_CONFIGURED" as const;

    constructor() {
        super({
            message:
                "This installation cannot send email, so password reset codes cannot be " +
                "delivered. An administrator can set a password directly by running " +
                "`yarn webiny reset-password <email>`, or configure a mail transport in Settings."
        });
    }
}

/**
 * Too many codes have been requested for this address lately. Counted for every address that is
 * asked about, including addresses with no account, so that arriving at this error reveals nothing
 * beyond the fact that somebody has been typing it in.
 */
export class TooManyResetRequestsError extends BaseError {
    override readonly code = "TOO_MANY_RESET_REQUESTS" as const;

    constructor() {
        super({
            message: "Too many password reset requests for this email address. Try again later."
        });
    }
}

export class WeakPasswordError extends BaseError {
    override readonly code = "WEAK_PASSWORD" as const;

    constructor(message: string) {
        super({ message });
    }
}
