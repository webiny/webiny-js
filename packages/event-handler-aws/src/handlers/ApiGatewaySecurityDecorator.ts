import type { APIGatewayProxyEvent } from "@webiny/aws-sdk/types/index.js";
import { ApiGatewayEventHandler } from "~/abstractions/handlers/ApiGatewayEventHandler.js";
import {
    RequestIdentityEstablisher,
    RequestTenantEstablisher
} from "@webiny/api-core/features/requestContext/index.js";
import type {
    IRequestIdentityEstablisher,
    IRequestTenantEstablisher
} from "@webiny/api-core/features/requestContext/abstractions.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";

/**
 * Thin transport adapter: establishes identity then tenant from the API Gateway event using the
 * shared, transport-agnostic establishers (which consume the registered AuthTokenExtractor /
 * TenantIdExtractor implementations), then delegates to the inner handler.
 *
 * Identity is established before tenant to preserve the previous decorator chain order.
 */
class ApiGatewaySecurityDecoratorImpl implements ApiGatewayEventHandler.Interface {
    constructor(
        private identityEstablisher: IRequestIdentityEstablisher,
        private tenantEstablisher: IRequestTenantEstablisher,
        private inner: ApiGatewayEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<APIGatewayProxyEvent>, next: NextFunction): Promise<any> {
        await this.identityEstablisher.establish(ctx.event);
        await this.tenantEstablisher.establish(ctx.event);
        return this.inner.execute(ctx, next);
    }
}

export const ApiGatewaySecurityDecorator = ApiGatewayEventHandler.createDecorator({
    decorator: ApiGatewaySecurityDecoratorImpl,
    dependencies: [RequestIdentityEstablisher, RequestTenantEstablisher]
});
