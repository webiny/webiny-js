import type { IncomingMessage } from "node:http";
import { NodeHttpEventHandler } from "@webiny/event-handler-standalone";
import {
    RawAuthToken,
    RequestIdentityLoader
} from "@webiny/api-core/features/requestContext/index.js";
import type { IRequestIdentityLoader } from "@webiny/api-core/features/requestContext/abstractions.js";
import { AuthenticationError } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { corsHeaders } from "@webiny/event-handler-core";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import type { IHttpResponse } from "@webiny/event-handler-core";

function headerValue(value: string | string[] | undefined): string {
    if (Array.isArray(value)) {
        return value[0] ?? "";
    }
    return value ?? "";
}

function parseCookieHeader(cookieHeader: string): Record<string, string> {
    return cookieHeader.split(";").reduce<Record<string, string>>((acc, pair) => {
        const idx = pair.indexOf("=");
        if (idx > 0) {
            acc[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
        }
        return acc;
    }, {});
}

/*
 * The answer to a request whose token an identity provider rejected, for example from
 * `verifyTokenClaims`. The body has the `{ message, code, data }` shape of the other error responses,
 * which is what the Admin reads to recognize an `Authentication/` error. This runs before the
 * router, so `SecureHeadersDecorator` never sees the response and the CORS headers are added here.
 */
function authenticationErrorResponse(
    request: IncomingMessage,
    error: AuthenticationError
): IHttpResponse {
    const cors = corsHeaders(request.headers.origin);

    return {
        statusCode: 401,
        headers: {
            ...cors,
            "content-type": "application/json",
            "www-authenticate": 'Bearer error="invalid_token"'
        },
        body: {
            message: error.message,
            code: error.code,
            data: null
        }
    };
}

/**
 * EXTRACT (transport-specific): reads the auth token from a Node `IncomingMessage` —
 * `x-webiny-authorization` first, then the bearer `Authorization` header, then the `wby-id-token`
 * cookie — into RawAuthToken, then invokes the shared LOAD step (RequestIdentityLoader) which
 * authenticates it (via the registered identity provider, e.g. the self-hosted JWT IdP) and sets
 * IdentityContext.
 *
 * `x-webiny-authorization` exists for AWS parity: behind CloudFront with Origin Access Control, SigV4
 * occupies the `Authorization` header, so clients that may traverse such an origin send the token in
 * that header instead. Standalone has no such constraint, but it accepts the same header so one
 * client works against both deployments.
 *
 * A token an identity provider rejects ends the request with a 401. Any other error propagates.
 *
 * Node mirror of ApiGatewayIdentityLoaderDecorator. Registered before the tenant loader, which makes
 * it the inner wrapper: the tenant is loaded first, because API-key authentication looks the key up
 * in the tenant's partition.
 */
class NodeHttpIdentityLoaderDecoratorImpl implements NodeHttpEventHandler.Interface {
    constructor(
        private rawAuthToken: RawAuthToken.Interface,
        private identityLoader: IRequestIdentityLoader,
        private decoratee: NodeHttpEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<IncomingMessage>, next: NextFunction): Promise<any> {
        this.rawAuthToken.set(this.extractToken(ctx.event));
        try {
            await this.identityLoader.establish();
        } catch (error) {
            if (error instanceof AuthenticationError) {
                return authenticationErrorResponse(ctx.event, error);
            }
            throw error;
        }
        return this.decoratee.execute(ctx, next);
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
        if (bearer) {
            return bearer;
        }
        const cookieHeader = headerValue(headers["cookie"] ?? headers["Cookie"]);
        return parseCookieHeader(cookieHeader)["wby-id-token"] ?? null;
    }
}

export const NodeHttpIdentityLoaderDecorator = NodeHttpEventHandler.createDecorator({
    decorator: NodeHttpIdentityLoaderDecoratorImpl,
    dependencies: [RawAuthToken, RequestIdentityLoader]
});
