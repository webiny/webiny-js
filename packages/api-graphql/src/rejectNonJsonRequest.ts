import { hasJsonContentType } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";

export const GRAPHQL_UNSUPPORTED_MEDIA_TYPE = "GRAPHQL_UNSUPPORTED_MEDIA_TYPE";

/**
 * GraphQL requests must be sent as `application/json` (parameters such as `charset` are allowed).
 *
 * Other content types (e.g. `text/plain`, form posts) are "simple" requests that browsers send
 * cross-site without a CORS preflight, so they are refused with a 415 before the body is read.
 * Returns that response, or `null` when the request is JSON and may proceed.
 */
export function rejectNonJsonRequest(request: IHttpRequest): IHttpResponse | null {
    if (hasJsonContentType(request.headers)) {
        return null;
    }
    return {
        statusCode: 415,
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
        },
        body: {
            data: null,
            error: {
                message: 'GraphQL requests must be sent with "Content-Type: application/json".',
                code: GRAPHQL_UNSUPPORTED_MEDIA_TYPE,
                data: null
            }
        }
    };
}
