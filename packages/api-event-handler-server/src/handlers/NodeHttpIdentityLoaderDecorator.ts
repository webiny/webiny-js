import type { IncomingMessage } from "node:http";
import { NodeHttpEventHandler } from "@webiny/event-handler-server";
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

function parseCookieHeader(cookieHeader: string): Record<string, string> {
    return cookieHeader.split(";").reduce<Record<string, string>>((acc, pair) => {
        const idx = pair.indexOf("=");
        if (idx > 0) {
            acc[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
        }
        return acc;
    }, {});
}

/**
 * EXTRACT (transport-specific): reads the auth token from a Node `IncomingMessage` — bearer
 * `Authorization` header preferred, then the `wby-id-token` cookie — into RawAuthToken, then invokes
 * the shared LOAD step (RequestIdentityLoader) which authenticates it (via the registered identity
 * provider, e.g. the self-hosted JWT IdP) and sets IdentityContext.
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
