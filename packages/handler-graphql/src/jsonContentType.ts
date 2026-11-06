import type { Reply, Request } from "@webiny/handler/types.js";

export const GRAPHQL_UNSUPPORTED_MEDIA_TYPE = "GRAPHQL_UNSUPPORTED_MEDIA_TYPE";

/**
 * GraphQL requests must be sent as `application/json` (parameters such as `charset` are allowed).
 *
 * Other content types (e.g. `text/plain`, form posts) are "simple" requests that browsers send
 * cross-site without a CORS preflight, so they are refused before the request body is read.
 */
export const isJsonContentType = (request: Pick<Request, "headers">): boolean => {
    const header = request.headers["content-type"];
    const value = Array.isArray(header) ? header[0] : header;
    if (!value) {
        return false;
    }
    const mediaType = value.split(";")[0].trim().toLowerCase();
    return mediaType === "application/json";
};

export const replyUnsupportedMediaType = (reply: Reply): Reply => {
    return reply
        .code(415)
        .headers({ "Cache-Control": "no-store" })
        .send({
            data: null,
            error: {
                message: 'GraphQL requests must be sent with "Content-Type: application/json".',
                code: GRAPHQL_UNSUPPORTED_MEDIA_TYPE,
                data: null
            }
        });
};

/**
 * An invalid GraphQL request body (e.g. no `query`) is a client error, so it gets a 400.
 */
export const replyInvalidRequestBody = (reply: Reply, error: unknown): Reply | null => {
    const ex = error as { code?: string; message?: string; data?: unknown };
    if (ex?.code !== "GRAPHQL_REQUEST_INVALID") {
        return null;
    }
    return reply
        .code(400)
        .headers({ "Cache-Control": "no-store" })
        .send({
            message: ex.message,
            code: ex.code,
            data: ex.data ?? null
        });
};
