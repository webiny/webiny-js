import type { APIGatewayProxyEvent } from "@webiny/aws-sdk/types/index.js";
import { ApiGatewayEventHandler } from "~/abstractions/handlers/ApiGatewayEventHandler.js";
import { AuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById/index.js";
import type { IAuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import type { IIdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import type { ITenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import type { IGetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById/abstractions.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";

/**
 * Reads the Authorization header from the API Gateway event and authenticates
 * the request, setting the identity in IdentityContext.
 */
class ApiGatewayAuthDecoratorImpl implements ApiGatewayEventHandler.Interface {
    constructor(
        private authCtx: IAuthenticationContext,
        private identityCtx: IIdentityContext,
        private inner: ApiGatewayEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<APIGatewayProxyEvent>, next: NextFunction): Promise<any> {
        const headers = ctx.event.headers ?? {};
        const token = headers["authorization"] ?? headers["Authorization"] ?? "";
        const identity = await this.authCtx.authenticate(token);
        this.identityCtx.setIdentity(identity);
        return this.inner.execute(ctx, next);
    }
}

export const ApiGatewayAuthDecorator = ApiGatewayEventHandler.createDecorator({
    decorator: ApiGatewayAuthDecoratorImpl,
    dependencies: [AuthenticationContext, IdentityContext]
});

/**
 * Reads the x-tenant header from the API Gateway event, loads the full Tenant
 * from storage, and sets it in TenantContext. Falls back to "root".
 */
class ApiGatewayTenantDecoratorImpl implements ApiGatewayEventHandler.Interface {
    constructor(
        private tenantCtx: ITenantContext,
        private getTenantById: IGetTenantByIdUseCase,
        private inner: ApiGatewayEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<APIGatewayProxyEvent>, next: NextFunction): Promise<any> {
        const headers = ctx.event.headers ?? {};
        const tenantId = headers["x-tenant"] ?? headers["X-Tenant"] ?? "root";

        const result = await this.getTenantById.execute(tenantId);
        if (result.isOk()) {
            this.tenantCtx.setTenant(result.value);
        } else {
            // Tenant not found — continue anyway; downstream code will handle missing tenant
            console.warn(`[ApiGatewayTenantDecorator] Tenant "${tenantId}" not found.`);
        }

        return this.inner.execute(ctx, next);
    }
}

export const ApiGatewayTenantDecorator = ApiGatewayEventHandler.createDecorator({
    decorator: ApiGatewayTenantDecoratorImpl,
    dependencies: [TenantContext, GetTenantByIdUseCase]
});
