import type { APIGatewayProxyEvent } from "@webiny/aws-sdk/types/index.js";
import { ApiGatewayEventHandler } from "~/abstractions/handlers/ApiGatewayEventHandler.js";
import { RequestIdentityEstablisher } from "@webiny/api-core/features/requestContext/index.js";
import type { IRequestIdentityEstablisher } from "@webiny/api-core/features/requestContext/abstractions.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";

/**
 * Thin transport adapter: establishes the request identity from the API Gateway event using the
 * shared, transport-agnostic RequestIdentityEstablisher (which consumes the registered
 * AuthTokenExtractor implementations), then delegates to the inner handler.
 *
 * Registered BEFORE ApiGatewayTenantEstablisherDecorator so identity is established before tenant
 * (see ApiGatewayFeature) — preserving the original decorator-chain order.
 */
class ApiGatewayIdentityEstablisherDecoratorImpl implements ApiGatewayEventHandler.Interface {
    constructor(
        private identityEstablisher: IRequestIdentityEstablisher,
        private inner: ApiGatewayEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<APIGatewayProxyEvent>, next: NextFunction): Promise<any> {
        await this.identityEstablisher.establish(ctx.event);
        return this.inner.execute(ctx, next);
    }
}

export const ApiGatewayIdentityEstablisherDecorator = ApiGatewayEventHandler.createDecorator({
    decorator: ApiGatewayIdentityEstablisherDecoratorImpl,
    dependencies: [RequestIdentityEstablisher]
});
