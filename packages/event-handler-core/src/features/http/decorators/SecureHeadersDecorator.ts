import { HttpRouter } from "~/features/http/abstractions.js";
import type { IHttpRouter, IHttpRequest, IHttpResponse } from "~/features/http/abstractions.js";

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
].join(", ");

const PRIVATE_FILES_PATH_PREFIX = "/private/";

/*
 * CORS never sends `access-control-allow-credentials`, so no other site can read a response that a
 * browser made with an ambient credential.
 *
 * Every route reflects the caller's origin (or `*`), except private file delivery (`/private/*`).
 * Those GET/HEAD requests are the only ones the `wby-id-token` cookie authenticates (an `<img src>`
 * cannot send an `Authorization` header), so they answer with a plain `*` origin: `<img src>`, links
 * and non-credentialed `fetch` calls keep working, while a credentialed cross-site `fetch` is refused
 * by the browser.
 */
class SecureHeadersDecoratorImpl implements IHttpRouter {
    constructor(private decoratee: IHttpRouter) {}

    async route(request: IHttpRequest): Promise<IHttpResponse> {
        if (request.method === "OPTIONS") {
            return this.optionsResponse(request);
        }

        const response = await this.decoratee.route(request);

        if (isPrivateFilePath(request.path)) {
            return {
                ...response,
                headers: {
                    ...response.headers,
                    "access-control-allow-origin": "*"
                }
            };
        }

        return {
            ...response,
            headers: {
                ...response.headers,
                "access-control-allow-origin": request.headers["origin"] || "*",
                vary: "origin"
            }
        };
    }

    private optionsResponse(request: IHttpRequest): IHttpResponse {
        return {
            statusCode: 204,
            headers: {
                "access-control-allow-origin": isPrivateFilePath(request.path)
                    ? "*"
                    : request.headers["origin"] || "*",
                "access-control-allow-methods": "OPTIONS,POST,GET,DELETE,PUT,PATCH",
                "access-control-allow-headers": ALLOWED_HEADERS,
                "access-control-max-age": "86400",
                "cache-control": "public, max-age=86400"
            }
        };
    }
}

function isPrivateFilePath(path: string): boolean {
    return path.startsWith(PRIVATE_FILES_PATH_PREFIX);
}

export const SecureHeadersDecorator = HttpRouter.createDecorator({
    decorator: SecureHeadersDecoratorImpl,
    dependencies: []
});
