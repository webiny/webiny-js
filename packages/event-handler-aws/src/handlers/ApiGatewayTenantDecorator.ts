import type { APIGatewayProxyEvent } from "@webiny/aws-sdk/types/index.js";
import { ApiGatewayEventHandler } from "~/abstractions/handlers/ApiGatewayEventHandler.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById/index.js";
import type { ITenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import type { IGetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById/abstractions.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";

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
            console.warn(`[ApiGatewayTenantDecorator] Tenant "${tenantId}" not found.`);
        }

        return this.inner.execute(ctx, next);
    }
}

export const ApiGatewayTenantDecorator = ApiGatewayEventHandler.createDecorator({
    decorator: ApiGatewayTenantDecoratorImpl,
    dependencies: [TenantContext, GetTenantByIdUseCase]
});
