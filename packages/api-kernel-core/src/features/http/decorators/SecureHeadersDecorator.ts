import { HttpAllowedRequestHeaders, HttpRouter } from "~/features/http/abstractions.js";
import type { IHttpRouter, IHttpRequest, IHttpResponse } from "~/features/http/abstractions.js";
import { corsHeaders } from "~/features/http/corsHeaders.js";
import { getHeader } from "~/features/http/getHeader.js";

const ALLOWED_HEADERS = [
    "accept",
    "authorization",
    "cache-control",
    "content-type",
    "x-i18n-locale",
    "x-tenant",
    // Streaming clients send the auth token here rather than in `Authorization`, which SigV4 occupies
    // when a Lambda Function URL sits behind CloudFront with Origin Access Control. Omitting it makes
    // the browser fail the preflight CORS check and never send the actual request.
    "x-webiny-authorization",
    // The SigV4 payload hash a streaming client sends when its request carries a body, because OAC
    // signs the request without hashing the body itself. Same consequence as above if omitted: the
    // browser fails the preflight and the real request is never sent.
    "x-amz-content-sha256",
    /*
     * The role or team the Admin is previewing. Sent on every request while a preview is active,
     * so omitting it would fail the preflight for all of them the moment a preview starts, on any
     * deploy where the Admin and the API are on different origins.
     */
    "x-webiny-assume-permissions",
    /*
     * Narrows what the debugger captures, for example `cms.os.*`. The Admin app does not send it;
     * it is for API clients that only want some namespaces. Capture itself is decided by the
     * identity's permissions, not by this header.
     */
    "x-webiny-debug"
];

/**
 * Private files are authenticated with the `wby-id-token` cookie. Their responses must not be
 * readable by other websites through a credentialed `fetch`, so they get a wildcard origin without
 * credentials. `<img src>`, links and plain `fetch` calls are not affected. One leading segment is
 * allowed for an API Gateway stage (`/default/private/...`).
 */
const PRIVATE_FILE_PATH = /^(\/[^/]+)?\/private\//;

const corsOriginHeaders = (request: IHttpRequest): Record<string, string> => {
    if (PRIVATE_FILE_PATH.test(request.path || "")) {
        return { "access-control-allow-origin": "*" };
    }
    // Header names reach the router in whatever case the transport and the client used.
    const origin = getHeader(request.headers, "origin");
    return corsHeaders(origin);
};

class SecureHeadersDecoratorImpl implements IHttpRouter {
    private readonly allowedHeaders: string;

    constructor(
        extensionHeaders: HttpAllowedRequestHeaders.Interface[],
        private decoratee: IHttpRouter
    ) {
        const extra = extensionHeaders.flatMap(item => item.headers.map(h => h.toLowerCase()));
        this.allowedHeaders = [...new Set([...ALLOWED_HEADERS, ...extra])].join(", ");
    }

    async route(request: IHttpRequest): Promise<IHttpResponse> {
        if (request.method === "OPTIONS") {
            return this.optionsResponse(request);
        }

        const response = await this.decoratee.route(request);

        return {
            ...response,
            headers: {
                ...response.headers,
                ...corsOriginHeaders(request),
                vary: "origin"
            }
        };
    }

    private optionsResponse(request: IHttpRequest): IHttpResponse {
        return {
            statusCode: 204,
            headers: {
                ...corsOriginHeaders(request),
                "access-control-allow-methods": "OPTIONS,POST,GET,DELETE,PUT,PATCH",
                "access-control-allow-headers": this.allowedHeaders,
                "access-control-max-age": "86400",
                "cache-control": "public, max-age=86400"
            }
        };
    }
}

export const SecureHeadersDecorator = HttpRouter.createDecorator({
    decorator: SecureHeadersDecoratorImpl,
    dependencies: [[HttpAllowedRequestHeaders, { multiple: true }]]
});
