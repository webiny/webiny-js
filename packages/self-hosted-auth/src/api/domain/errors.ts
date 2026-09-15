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

export class WeakPasswordError extends BaseError {
    override readonly code = "WEAK_PASSWORD" as const;

    constructor(message: string) {
        super({ message });
    }
}
