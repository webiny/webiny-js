import type { APIGatewayProxyEvent } from "@webiny/aws-sdk/types/index.js";
import { ApiGatewayEventHandler } from "~/abstractions/handlers/ApiGatewayEventHandler.js";
import { RequestTenantEstablisher } from "@webiny/api-core/features/requestContext/index.js";
import type { IRequestTenantEstablisher } from "@webiny/api-core/features/requestContext/abstractions.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";

/**
 * Thin transport adapter: establishes the request tenant from the API Gateway event using the
 * shared, transport-agnostic RequestTenantEstablisher (which consumes the registered
 * TenantIdExtractor implementations — e.g. the "x-tenant" header), then delegates to the inner
 * handler.
 *
 * Registered AFTER ApiGatewayIdentityEstablisherDecorator (see ApiGatewayFeature).
 */
class ApiGatewayTenantEstablisherDecoratorImpl implements ApiGatewayEventHandler.Interface {
    constructor(
        private tenantEstablisher: IRequestTenantEstablisher,
        private inner: ApiGatewayEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<APIGatewayProxyEvent>, next: NextFunction): Promise<any> {
        await this.tenantEstablisher.establish(ctx.event);
        return this.inner.execute(ctx, next);
    }
}

export const ApiGatewayTenantEstablisherDecorator = ApiGatewayEventHandler.createDecorator({
    decorator: ApiGatewayTenantEstablisherDecoratorImpl,
    dependencies: [RequestTenantEstablisher]
});
