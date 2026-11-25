import type { APIGatewayProxyEvent } from "@webiny/aws-sdk/types/index.js";
import { ApiGatewayInputHandler } from "@webiny/api-kernel-aws";
import {
    RawTenantId,
    RequestTenantLoader
} from "@webiny/api-core/features/requestContext/index.js";
import type { IRequestTenantLoader } from "@webiny/api-core/features/requestContext/abstractions.js";
import type { InputContext, NextFunction } from "@webiny/api-kernel-core";
import { extractTenantId } from "@webiny/api-composition-core";

/**
 * EXTRACT (transport-specific): reads the tenant id from the `x-tenant` header of an API Gateway
 * event into RawTenantId, then invokes the shared LOAD step (RequestTenantLoader) which
 * resolves the Tenant and sets TenantContext. A missing header leaves RawTenantId null → the
 * loader defaults to the "root" tenant.
 *
 * Registered AFTER ApiGatewayIdentityLoaderDecorator (see ApiGatewayFeature).
 */
class ApiGatewayTenantLoaderDecoratorImpl implements ApiGatewayInputHandler.Interface {
    constructor(
        private rawTenantId: RawTenantId.Interface,
        private tenantLoader: IRequestTenantLoader,
        private decoratee: ApiGatewayInputHandler.Interface
    ) {}

    async execute(ctx: InputContext<APIGatewayProxyEvent>, next: NextFunction): Promise<any> {
        const headers = ctx.input?.headers as Record<string, string>;
        const tenantId = extractTenantId(headers);
        this.rawTenantId.set(tenantId);
        await this.tenantLoader.establish();
        return this.decoratee.execute(ctx, next);
    }
}

export const ApiGatewayTenantLoaderDecorator = ApiGatewayInputHandler.createDecorator({
    decorator: ApiGatewayTenantLoaderDecoratorImpl,
    dependencies: [RawTenantId, RequestTenantLoader]
});
