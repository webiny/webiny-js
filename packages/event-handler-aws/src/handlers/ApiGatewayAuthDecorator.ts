import type { APIGatewayProxyEvent } from "@webiny/aws-sdk/types/index.js";
import { ApiGatewayEventHandler } from "~/abstractions/handlers/ApiGatewayEventHandler.js";
import { AuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { IAuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import type { IIdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";

class ApiGatewayAuthDecoratorImpl implements ApiGatewayEventHandler.Interface {
    constructor(
        private authCtx: IAuthenticationContext,
        private identityCtx: IIdentityContext,
        private inner: ApiGatewayEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<APIGatewayProxyEvent>, next: NextFunction): Promise<any> {
        const headers = ctx.event.headers ?? {};
        const raw = headers["authorization"] ?? headers["Authorization"] ?? "";
        const token = raw.replace(/^Bearer\s+/i, "");
        const identity = await this.authCtx.authenticate(token);
        this.identityCtx.setIdentity(identity);
        return this.inner.execute(ctx, next);
    }
}

export const ApiGatewayAuthDecorator = ApiGatewayEventHandler.createDecorator({
    decorator: ApiGatewayAuthDecoratorImpl,
    dependencies: [AuthenticationContext, IdentityContext]
});
