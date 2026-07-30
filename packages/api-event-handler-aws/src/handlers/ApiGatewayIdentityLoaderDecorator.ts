import type { APIGatewayProxyEvent } from "@webiny/aws-sdk/types/index.js";
import { ApiGatewayEventHandler } from "@webiny/event-handler-aws";
import {
    RawAuthToken,
    RequestIdentityLoader
} from "@webiny/api-core/features/requestContext/index.js";
import type { IRequestIdentityLoader } from "@webiny/api-core/features/requestContext/abstractions.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import { extractAuthToken } from "./extractRequestAuth.js";

/**
 * EXTRACT (transport-specific): reads the auth token from an API Gateway event — see
 * {@link extractAuthToken} for the header precedence — into RawAuthToken, then invokes the shared LOAD
 * step (RequestIdentityLoader) which authenticates it and sets IdentityContext.
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
        this.rawAuthToken.set(extractAuthToken(ctx.event?.headers as Record<string, string>));
        await this.identityLoader.establish();
        return this.decoratee.execute(ctx, next);
    }
}

export const ApiGatewayIdentityLoaderDecorator = ApiGatewayEventHandler.createDecorator({
    decorator: ApiGatewayIdentityLoaderDecoratorImpl,
    dependencies: [RawAuthToken, RequestIdentityLoader]
});
