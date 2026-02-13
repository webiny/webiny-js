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

type GraphQLErrorData = {
    code?: string;
};

/**
 * GraphQL error from the API.
 */
export class GraphQLError extends BaseError<GraphQLErrorData> {
    override readonly code = "GRAPHQL_ERROR" as const;

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
