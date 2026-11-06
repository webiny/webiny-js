import type { APIGatewayProxyEvent } from "@webiny/aws-sdk/types/index.js";
import { ApiGatewayEventHandler } from "@webiny/event-handler-aws";
import type { ApiGatewayResult } from "@webiny/event-handler-aws";
import {
    RawAuthToken,
    RequestIdentityLoader
} from "@webiny/api-core/features/requestContext/index.js";
import type { IRequestIdentityLoader } from "@webiny/api-core/features/requestContext/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { IIdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import {
    idTokenCookieCacheControl,
    serializeIdTokenCookie
} from "@webiny/api-event-handler-core/idTokenCookie/idTokenCookie.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import { extractApiGatewayCookieAuthToken, extractAuthToken } from "./extractRequestAuth.js";

/**
 * EXTRACT (transport-specific): reads the auth token from an API Gateway event — see
 * {@link extractAuthToken} for the header precedence — into RawAuthToken, then invokes the shared LOAD
 * step (RequestIdentityLoader) which authenticates it and sets IdentityContext.
 *
 * Header tokens always win. Only when no header token is present may a GET/HEAD request under
 * `/private/` authenticate with the `wby-id-token` cookie ({@link extractApiGatewayCookieAuthToken}):
 * private file delivery needs it because an `<img src>` cannot send an `Authorization` header.
 *
 * When a header token authenticates a non-anonymous identity, the response sets that token as the
 * `wby-id-token` cookie, so the browser can load private files afterwards. A request authenticated
 * by the cookie itself never sets it again.
 *
 * A missing token leaves RawAuthToken null → the loader authenticates as anonymous.
 * Registered BEFORE ApiGatewayTenantLoaderDecorator so identity is established before tenant
 * (see ApiGatewayFeature).
 */
class ApiGatewayIdentityLoaderDecoratorImpl implements ApiGatewayEventHandler.Interface {
    constructor(
        private rawAuthToken: RawAuthToken.Interface,
        private identityLoader: IRequestIdentityLoader,
        private identityContext: IIdentityContext,
        private decoratee: ApiGatewayEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<APIGatewayProxyEvent>, next: NextFunction): Promise<any> {
        const headers = ctx.event?.headers as Record<string, string>;
        const headerToken = extractAuthToken(headers);
        const authToken = headerToken ?? extractApiGatewayCookieAuthToken(ctx.event);

        this.rawAuthToken.set(authToken);

        await this.identityLoader.establish();

        const cookieToken =
            headerToken && !this.identityContext.getIdentity().isAnonymous() ? headerToken : null;

        const result = await this.decoratee.execute(ctx, next);
        if (!cookieToken || !isApiGatewayResult(result)) {
            return result;
        }
        return withIdTokenCookie(result, cookieToken);
    }
}

function isApiGatewayResult(result: unknown): result is ApiGatewayResult {
    return !!result && typeof result === "object" && "statusCode" in result;
}

/**
 * Adds the `wby-id-token` `Set-Cookie` in both shapes API Gateway understands — `multiValueHeaders`
 * (payload format 1.0) and `cookies` (2.0) — next to any cookie the route set.
 */
function withIdTokenCookie(result: ApiGatewayResult, token: string): ApiGatewayResult {
    const existing = result.cookies ?? (result.multiValueHeaders?.["set-cookie"] ?? []).map(String);
    const cookies = [...existing, serializeIdTokenCookie(token)];
    const headers = { ...result.headers };
    headers["cache-control"] = idTokenCookieCacheControl(
        headers["cache-control"] === undefined ? undefined : String(headers["cache-control"])
    );

    return {
        ...result,
        headers,
        multiValueHeaders: { ...result.multiValueHeaders, "set-cookie": cookies },
        cookies
    };
}

export const ApiGatewayIdentityLoaderDecorator = ApiGatewayEventHandler.createDecorator({
    decorator: ApiGatewayIdentityLoaderDecoratorImpl,
    dependencies: [RawAuthToken, RequestIdentityLoader, IdentityContext]
});
