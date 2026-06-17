import type { APIGatewayProxyEvent } from "@webiny/aws-sdk/types/index.js";
import { ApiGatewayEventHandler } from "~/abstractions/handlers/ApiGatewayEventHandler.js";
import { AuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { IAuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import type { IIdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
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

class ApiGatewayCookieAuthDecoratorImpl implements ApiGatewayEventHandler.Interface {
    constructor(
        private authCtx: IAuthenticationContext,
        private identityCtx: IIdentityContext,
        private inner: ApiGatewayEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<APIGatewayProxyEvent>, next: NextFunction): Promise<any> {
        if (!this.identityCtx.getIdentity().isAnonymous()) {
            return this.inner.execute(ctx, next);
        }

        const headers = ctx.event.headers ?? {};
        const cookieHeader = headers["cookie"] ?? headers["Cookie"] ?? "";
        const token = parseCookieHeader(cookieHeader)["wby-id-token"];

        if (token) {
            const identity = await this.authCtx.authenticate(token);
            this.identityCtx.setIdentity(identity);
        }

        return this.inner.execute(ctx, next);
    }
}

export const ApiGatewayCookieAuthDecorator = ApiGatewayEventHandler.createDecorator({
    decorator: ApiGatewayCookieAuthDecoratorImpl,
    dependencies: [AuthenticationContext, IdentityContext]
});
