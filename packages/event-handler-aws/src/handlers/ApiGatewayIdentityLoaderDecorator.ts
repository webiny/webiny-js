import type { APIGatewayProxyEvent } from "@webiny/aws-sdk/types/index.js";
import { ApiGatewayEventHandler } from "~/abstractions/handlers/ApiGatewayEventHandler.js";
import {
    RawAuthToken,
    RequestIdentityLoader
} from "@webiny/api-core/features/requestContext/index.js";
import type { IRequestIdentityLoader } from "@webiny/api-core/features/requestContext/abstractions.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";

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
 * EXTRACT (transport-specific): reads the auth token from an API Gateway event — bearer
 * `Authorization` header preferred, then the `wby-id-token` cookie — into RawAuthToken, then invokes
 * the shared LOAD step (RequestIdentityLoader) which authenticates it and sets IdentityContext.
 *
 * A missing token leaves RawAuthToken null → the loader authenticates as anonymous.
 * Registered BEFORE ApiGatewayTenantLoaderDecorator so identity is established before tenant
 * (see ApiGatewayFeature).
 */
class ApiGatewayIdentityLoaderDecoratorImpl implements ApiGatewayEventHandler.Interface {
    constructor(
        private rawAuthToken: RawAuthToken.Interface,
        private identityLoader: IRequestIdentityLoader,
        private decoratee: ApiGatewayEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<APIGatewayProxyEvent>, next: NextFunction): Promise<any> {
        this.rawAuthToken.set(this.extractToken(ctx.event));
        await this.identityLoader.establish();
        return this.decoratee.execute(ctx, next);
    }

    private extractToken(event: APIGatewayProxyEvent): string | null {
        const headers = event?.headers;
        if (!headers) {
            return null;
        }
        const bearer = (headers["authorization"] ?? headers["Authorization"] ?? "").replace(
            /^Bearer\s+/i,
            ""
        );
        if (bearer) {
            return bearer;
        }
        const cookieHeader = headers["cookie"] ?? headers["Cookie"] ?? "";
        return parseCookieHeader(cookieHeader)["wby-id-token"] ?? null;
    }
}

export const ApiGatewayIdentityLoaderDecorator = ApiGatewayEventHandler.createDecorator({
    decorator: ApiGatewayIdentityLoaderDecoratorImpl,
    dependencies: [RawAuthToken, RequestIdentityLoader]
});
