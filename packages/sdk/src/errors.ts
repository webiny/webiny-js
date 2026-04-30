import { BaseError } from "./BaseError.js";

type HttpErrorData = {
    status: number;
};

/**
 * HTTP error from the API.
 */
export class HttpError extends BaseError<HttpErrorData> {
    override readonly code = "HTTP_ERROR" as const;

    constructor(status: number, message: string) {
        super({
            message,
            data: { status }
        });
    }
}

type ApiErrorData = {
    code?: string;
};

/**
 * GraphQL error from the API.
 */
export class ApiError extends BaseError<ApiErrorData> {
    override readonly code = "API_ERROR" as const;

    constructor(message: string, errorCode?: string) {
        super({
            message,
            data: { code: errorCode }
        });
    }
}

/**
 * Network error (fetch failed).
 */
export class NetworkError extends BaseError {
    override readonly code = "NETWORK_ERROR" as const;

    constructor(message: string) {
        super({
            message
        });
    }
}

/**
 * Input validation error — params failed schema validation before any network request was made.
 */
export class ValidationError extends BaseError {
    override readonly code = "VALIDATION_ERROR" as const;

    constructor(message: string) {
        super({ message });
    }
}
