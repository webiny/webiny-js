import type { APIGatewayProxyEvent } from "@webiny/aws-sdk/types/index.js";
import { ApiGatewayEventHandler } from "~/abstractions/handlers/ApiGatewayEventHandler.js";
import {
    RawTenantId,
    RequestTenantLoader
} from "@webiny/api-core/features/requestContext/index.js";
import type { IRequestTenantLoader } from "@webiny/api-core/features/requestContext/abstractions.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";

/**
 * EXTRACT (transport-specific): reads the tenant id from the `x-tenant` header of an API Gateway
 * event into RawTenantId, then invokes the shared LOAD step (RequestTenantLoader) which
 * resolves the Tenant and sets TenantContext. A missing header leaves RawTenantId null → the
 * establisher defaults to the "root" tenant.
 *
 * Registered AFTER ApiGatewayIdentityEstablisherDecorator (see ApiGatewayFeature).
 */
class ApiGatewayTenantEstablisherDecoratorImpl implements ApiGatewayEventHandler.Interface {
    constructor(
        private rawTenantId: RawTenantId.Interface,
        private tenantEstablisher: IRequestTenantLoader,
        private decoratee: ApiGatewayEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<APIGatewayProxyEvent>, next: NextFunction): Promise<any> {
        const headers = ctx.event?.headers;
        this.rawTenantId.set(headers ? (headers["x-tenant"] ?? headers["X-Tenant"] ?? null) : null);
        await this.tenantEstablisher.establish();
        return this.decoratee.execute(ctx, next);
    }
}

export const ApiGatewayTenantEstablisherDecorator = ApiGatewayEventHandler.createDecorator({
    decorator: ApiGatewayTenantEstablisherDecoratorImpl,
    dependencies: [RawTenantId, RequestTenantLoader]
});
