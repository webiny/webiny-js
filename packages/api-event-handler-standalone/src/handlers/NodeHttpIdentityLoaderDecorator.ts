import type { IncomingMessage } from "node:http";
import { NodeHttpEventHandler } from "@webiny/event-handler-standalone";
import { nodeHttpRequestPath } from "@webiny/event-handler-standalone";
import {
    RawAuthToken,
    RequestIdentityLoader
} from "@webiny/api-core/features/requestContext/index.js";
import type { IRequestIdentityLoader } from "@webiny/api-core/features/requestContext/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { IIdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import {
    idTokenCookieCacheControl,
    isIdTokenCookieAllowed,
    readIdTokenCookie,
    serializeIdTokenCookie
} from "@webiny/api-event-handler-core/idTokenCookie/idTokenCookie.js";
import type { EventContext, IHttpResponse, NextFunction } from "@webiny/event-handler-core";

function headerValue(value: string | string[] | undefined): string {
    if (Array.isArray(value)) {
        return value[0] ?? "";
    }
    return value ?? "";
}

/**
 * EXTRACT (transport-specific): reads the auth token from a Node `IncomingMessage` —
 * `x-webiny-authorization` first, then the bearer `Authorization` header — into RawAuthToken, then
 * invokes the shared LOAD step (RequestIdentityLoader) which authenticates it (via the registered
 * identity provider, e.g. the self-hosted JWT IdP) and sets IdentityContext.
 *
 * `x-webiny-authorization` exists for AWS parity: behind CloudFront with Origin Access Control, SigV4
 * occupies the `Authorization` header, so clients that may traverse such an origin send the token in
 * that header instead. Standalone has no such constraint, but it accepts the same header so one
 * client works against both deployments.
 *
 * Header tokens always win. Only when no header token is present may a GET/HEAD request under
 * `/private/` authenticate with the `wby-id-token` cookie: private file delivery needs it because an
 * `<img src>` cannot send an `Authorization` header. Anywhere else the cookie is ignored: it is
 * `SameSite=None`, so the browser attaches it to cross-site requests too, and honouring it would let
 * any website call the API as the user (CSRF).
 *
 * When a header token authenticates a non-anonymous identity, the response sets that token as the
 * `wby-id-token` cookie, so the browser can load private files afterwards. A request authenticated
 * by the cookie itself never sets it again.
 *
 * Node mirror of ApiGatewayIdentityLoaderDecorator. Registered BEFORE the tenant loader so identity
 * is established before tenant.
 */
class NodeHttpIdentityLoaderDecoratorImpl implements NodeHttpEventHandler.Interface {
    constructor(
        private rawAuthToken: RawAuthToken.Interface,
        private identityLoader: IRequestIdentityLoader,
        private identityContext: IIdentityContext,
        private decoratee: NodeHttpEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<IncomingMessage>, next: NextFunction): Promise<any> {
        const headerToken = this.extractToken(ctx.event);
        this.rawAuthToken.set(headerToken ?? this.extractCookieToken(ctx.event));

        await this.identityLoader.establish();

        const cookieToken =
            headerToken && !this.identityContext.getIdentity().isAnonymous() ? headerToken : null;

        const response = await this.decoratee.execute(ctx, next);
        if (!cookieToken || !isHttpResponse(response)) {
            return response;
        }
        return withIdTokenCookie(response, cookieToken);
    }

    private extractToken(event: IncomingMessage): string | null {
        const headers = event?.headers;
        if (!headers) {
            return null;
        }
        const webinyAuth = headerValue(
            headers["x-webiny-authorization"] ?? headers["X-Webiny-Authorization"]
        ).replace(/^Bearer\s+/i, "");
        if (webinyAuth) {
            return webinyAuth;
        }
        const bearer = headerValue(headers["authorization"] ?? headers["Authorization"]).replace(
            /^Bearer\s+/i,
            ""
        );
        return bearer || null;
    }

    private extractCookieToken(event: IncomingMessage): string | null {
        if (
            !event?.headers ||
            !isIdTokenCookieAllowed(event.method || "GET", nodeHttpRequestPath(event))
        ) {
            return null;
        }
        return readIdTokenCookie(headerValue(event.headers["cookie"] ?? event.headers["Cookie"]));
    }
}

function isHttpResponse(response: unknown): response is IHttpResponse {
    return !!response && typeof response === "object" && "statusCode" in response;
}

function withIdTokenCookie(response: IHttpResponse, token: string): IHttpResponse {
    return {
        ...response,
        headers: {
            ...response.headers,
            "cache-control": idTokenCookieCacheControl(response.headers?.["cache-control"])
        },
        cookies: [...(response.cookies ?? []), serializeIdTokenCookie(token)]
    };
}

export const NodeHttpIdentityLoaderDecorator = NodeHttpEventHandler.createDecorator({
    decorator: NodeHttpIdentityLoaderDecoratorImpl,
    dependencies: [RawAuthToken, RequestIdentityLoader, IdentityContext]
});
