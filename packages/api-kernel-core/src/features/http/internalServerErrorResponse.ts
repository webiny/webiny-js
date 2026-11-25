import type { IHttpResponse } from "./abstractions.js";

/**
 * The answer to an error that carries nothing a client should see. `ErrorResponseDecorator` and every
 * transport's last-resort catch return it, so the body is defined once.
 */
export function internalServerErrorResponse(): IHttpResponse {
    return {
        statusCode: 500,
        headers: { "content-type": "application/json" },
        body: { message: "Internal server error" }
    };
}
