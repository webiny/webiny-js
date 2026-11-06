import { FunctionUrlStreamEventHandler } from "@webiny/event-handler-aws";
import {
    RawAuthToken,
    RequestIdentityLoader
} from "@webiny/api-core/features/requestContext/index.js";
import type { IRequestIdentityLoader } from "@webiny/api-core/features/requestContext/abstractions.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import { extractAuthToken, headersFromFunctionUrlEvent } from "./extractRequestAuth.js";

/**
 * EXTRACT (transport-specific): the Function URL streaming counterpart of
 * `ApiGatewayIdentityLoaderDecorator`. Same shared LOAD step and the same header token extraction.
 *
 * Unlike API Gateway, it never accepts the `wby-id-token` cookie (that exists only for private file
 * delivery, which is not served here) and never sets it on the streamed response.
 *
 * Registered BEFORE FunctionUrlStreamTenantLoaderDecorator so identity is established before tenant.
 */
class FunctionUrlStreamIdentityLoaderDecoratorImpl
    implements FunctionUrlStreamEventHandler.Interface
{
    constructor(
        private rawAuthToken: RawAuthToken.Interface,
        private identityLoader: IRequestIdentityLoader,
        private decoratee: FunctionUrlStreamEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<any>, next: NextFunction): Promise<void> {
        const headers = headersFromFunctionUrlEvent(ctx.event);
        const authToken = extractAuthToken(headers);

        this.rawAuthToken.set(authToken);

        await this.identityLoader.establish();
        return this.decoratee.execute(ctx, next);
    }
}

export const FunctionUrlStreamIdentityLoaderDecorator =
    FunctionUrlStreamEventHandler.createDecorator({
        decorator: FunctionUrlStreamIdentityLoaderDecoratorImpl,
        dependencies: [RawAuthToken, RequestIdentityLoader]
    });
