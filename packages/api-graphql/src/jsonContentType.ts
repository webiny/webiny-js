import type { IHttpRequest, IHttpResponse } from "@webiny/kernel-core";

export const GRAPHQL_UNSUPPORTED_MEDIA_TYPE = "GRAPHQL_UNSUPPORTED_MEDIA_TYPE";

const getHeader = (headers: IHttpRequest["headers"] | undefined, name: string) => {
    for (const [key, value] of Object.entries(headers || {})) {
        if (key.toLowerCase() === name) {
            return Array.isArray(value) ? value[0] : value;
        }
    }
    return undefined;
};

/**
 * GraphQL requests must be sent as `application/json` (parameters such as `charset` are allowed).
 *
 * Other content types (e.g. `text/plain`, form posts) are "simple" requests that browsers send
 * cross-site without a CORS preflight, so they are refused before the request body is read.
 */
export const isJsonContentType = (request: Pick<IHttpRequest, "headers">): boolean => {
    const value = getHeader(request.headers, "content-type");
    if (!value) {
        return false;
    }
    const mediaType = String(value).split(";")[0].trim().toLowerCase();
    return mediaType === "application/json";
};

export const unsupportedMediaTypeResponse = (): IHttpResponse => {
    return {
        statusCode: 415,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        body: {
            data: null,
            error: {
                message: 'GraphQL requests must be sent with "Content-Type: application/json".',
                code: GRAPHQL_UNSUPPORTED_MEDIA_TYPE,
                data: null
            }
        }
    };
};

/**
 * An invalid GraphQL request body (e.g. no `query`) is a client error, so it gets a 400.
 * Returns `null` for any other error, which the caller rethrows.
 */
export const invalidRequestBodyResponse = (error: unknown): IHttpResponse | null => {
    const ex = error as { code?: string; message?: string; data?: unknown };
    if (ex?.code !== "GRAPHQL_REQUEST_INVALID") {
        return null;
    }
    return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        body: {
            message: ex.message,
            code: ex.code,
            data: ex.data ?? null
        }
    };
};
