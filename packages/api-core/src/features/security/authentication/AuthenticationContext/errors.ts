import { BaseError } from "@webiny/feature/api";

/**
 * Base class for all authentication-related errors
 */
export abstract class AuthenticationError extends BaseError {
    protected constructor(message: string) {
        super({ message });
    }

    static from(error: any): AuthenticationError {
        // Check for specific jsonwebtoken error names
        if (error.name === "TokenExpiredError") {
            return new TokenExpiredError(error.message);
        }

        if (error.name === "NotBeforeError") {
            return new TokenNotYetValidError(error.message);
        }

        if (error.name === "JsonWebTokenError") {
            // Check message for specific error types
            const message = error.message.toLowerCase();

            if (message.includes("invalid signature")) {
                return new InvalidTokenSignatureError(error.message);
            }

            if (message.includes("invalid audience") || message.includes("jwt audience")) {
                return new InvalidAudienceError(error.message);
            }

            if (message.includes("invalid issuer") || message.includes("jwt issuer")) {
                return new InvalidIssuerError(error.message);
            }

            if (message.includes("jwt malformed") || message.includes("invalid token")) {
                return new InvalidTokenError(error.message);
            }

            // Generic JsonWebTokenError
            return new InvalidTokenError(error.message);
        }

        // If it's already one of our errors, return as-is
        if (error instanceof AuthenticationError) {
            return error;
        }

        // For any other error, wrap in InvalidTokenError
        return new InvalidTokenError(error.message || "Authentication failed");
    }
}

/**
 * Thrown when a JWT token has expired
 */
export class TokenExpiredError extends AuthenticationError {
    override readonly code = "Authentication/TokenExpired" as const;

    constructor(message: string = "Token has expired") {
        super(message);
    }
}

/**
 * Thrown when a JWT token is not yet valid (nbf claim)
 */
export class TokenNotYetValidError extends AuthenticationError {
    override readonly code = "Authentication/TokenNotYetValid" as const;

    constructor(message: string = "Token is not yet valid") {
        super(message);
    }
}

/**
 * Thrown when a JWT token has an invalid signature
 */
export class InvalidTokenSignatureError extends AuthenticationError {
    override readonly code = "Authentication/InvalidSignature" as const;

    constructor(message: string = "Invalid token signature") {
        super(message);
    }
}

/**
 * Thrown when a JWT token is malformed or invalid
 */
export class InvalidTokenError extends AuthenticationError {
    override readonly code = "Authentication/InvalidToken" as const;

    constructor(message: string = "Invalid token") {
        super(message);
    }
}

/**
 * Thrown when the JWT audience claim doesn't match expected value
 */
export class InvalidAudienceError extends AuthenticationError {
    override readonly code = "Authentication/InvalidAudience" as const;

    constructor(message: string = "Invalid audience") {
        super(message);
    }
}

/**
 * Thrown when the JWT issuer claim doesn't match expected value
 */
export class InvalidIssuerError extends AuthenticationError {
    override readonly code = "Authentication/InvalidIssuer" as const;

    constructor(message: string = "Invalid issuer") {
        super(message);
    }
}

/**
 * Thrown when a required JWT claim is missing
 */
export class MissingClaimError extends AuthenticationError {
    override readonly code = "Authentication/MissingClaim" as const;

    constructor(claim: string) {
        super(`Missing required claim: ${claim}`);
    }
}

/**
 * Generic authentication failure error
 */
export class AuthenticationFailedError extends AuthenticationError {
    override readonly code = "Authentication/Failed" as const;

    constructor(message: string = "Authentication failed") {
        super(message);
    }
}
