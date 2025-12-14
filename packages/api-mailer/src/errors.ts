import { BaseError } from "@webiny/feature/api";

export class NotAuthorizedError extends BaseError {
    override readonly code = "NOT_AUTHORIZED" as const;

    constructor(message?: string) {
        super({
            message: message || "Not authorized!"
        });
    }
}

interface ErrorData {
    originalError?: string;
}

export class EncryptionError extends BaseError<ErrorData> {
    override readonly code = "ENCRYPTION_ERROR" as const;

    constructor(message?: string, cause?: Error) {
        super({
            message: message || "Failed to encrypt password.",
            data: {
                originalError: cause?.message
            }
        });
    }
}

export class DecryptionError extends BaseError<ErrorData> {
    override readonly code = "DECRYPTION_ERROR" as const;

    constructor(message?: string, cause?: Error) {
        super({
            message: message || "Failed to decrypt password.",
            data: {
                originalError: cause?.message
            }
        });
    }
}
