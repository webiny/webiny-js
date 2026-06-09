import { HttpEventHandler } from "../abstractions/EventHandler.js";
import { isHttpRequest } from "../abstractions/IHttp.js";
import type { EventContext } from "../abstractions/EventHandler.js";
import type { NextFunction } from "../types.js";
import { GetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import type { IGetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById/abstractions.js";
import type { ITenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";

class TenantInitializerImpl implements HttpEventHandler.Interface {
    constructor(
        private tenantContext: ITenantContext,
        private getTenantById: IGetTenantByIdUseCase
    ) {}

    async execute(ctx: EventContext, next: NextFunction): Promise<any> {
        if (!isHttpRequest(ctx.event)) {
            return next();
        }

        const tenantId = ctx.event.headers["x-tenant"];
        if (!tenantId) {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Missing x-tenant header" })
            };
        }

        const result = await this.getTenantById.execute(tenantId);
        if (result.isFail()) {
            return {
                statusCode: 404,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: `Tenant not found: ${tenantId}` })
            };
        }

        this.tenantContext.setTenant(result.value);
        return next();
    }
}

export const TenantInitializer = HttpEventHandler.createImplementation({
    implementation: TenantInitializerImpl,
    dependencies: [TenantContext, GetTenantByIdUseCase]
});
