import type { IncomingMessage } from "node:http";
import { NodeHttpEventHandler } from "@webiny/event-handler-standalone";
import {
    RawAuthToken,
    RequestIdentityLoader
} from "@webiny/api-core/features/requestContext/index.js";
import type { IRequestIdentityLoader } from "@webiny/api-core/features/requestContext/abstractions.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";

function headerValue(value: string | string[] | undefined): string {
    if (Array.isArray(value)) {
        return value[0] ?? "";
    }
    return value ?? "";
}

/**
 * Finds one cookie and decodes only its value. Decoding every cookie would let any other cookie on the
 * domain that isn't valid URI encoding (`promo=50%off`) throw and fail the request.
 */
function readCookie(cookieHeader: string, name: string): string | null {
    for (const pair of cookieHeader.split(";")) {
        const idx = pair.indexOf("=");
        if (idx <= 0 || pair.slice(0, idx).trim() !== name) {
            continue;
        }
        const value = pair.slice(idx + 1).trim();
        try {
            return decodeURIComponent(value);
        } catch {
            // Not valid URI encoding, so not a token we issued.
            return null;
        }
    }
    return null;
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
 * Node mirror of ApiGatewayIdentityLoaderDecorator. Registered BEFORE the tenant loader so identity
 * is established before tenant.
 */
class NodeHttpIdentityLoaderDecoratorImpl implements NodeHttpEventHandler.Interface {
    constructor(
        private rawAuthToken: RawAuthToken.Interface,
        private identityLoader: IRequestIdentityLoader,
        private decoratee: NodeHttpEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<IncomingMessage>, next: NextFunction): Promise<any> {
        this.rawAuthToken.set(this.extractToken(ctx.event));
        await this.identityLoader.establish();
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
        return readCookie(cookieHeader, "wby-id-token");
    }
}

export const NodeHttpIdentityLoaderDecorator = NodeHttpEventHandler.createDecorator({
    decorator: NodeHttpIdentityLoaderDecoratorImpl,
    dependencies: [RawAuthToken, RequestIdentityLoader]
});
