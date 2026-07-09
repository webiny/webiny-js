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

export class WeakPasswordError extends BaseError {
    override readonly code = "WEAK_PASSWORD" as const;

    constructor(message: string) {
        super({ message });
    }
}
