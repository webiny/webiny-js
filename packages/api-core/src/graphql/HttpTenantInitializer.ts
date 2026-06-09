import { HttpEventHandler, HttpTenantIdExtractor, isHttpRequest } from "@webiny/event-handler-core";
import type {
    EventContext,
    NextFunction,
    IHttpTenantIdExtractor
} from "@webiny/event-handler-core";
import { GetTenantByIdUseCase } from "~/features/tenancy/GetTenantById/abstractions.js";
import { TenantContext } from "~/features/tenancy/TenantContext/abstractions.js";
import type { IGetTenantByIdUseCase } from "~/features/tenancy/GetTenantById/abstractions.js";
import type { ITenantContext } from "~/features/tenancy/TenantContext/abstractions.js";

class HttpTenantInitializerImpl implements HttpEventHandler.Interface {
    constructor(
        private tenantContext: ITenantContext,
        private getTenantById: IGetTenantByIdUseCase,
        private extractor: IHttpTenantIdExtractor
    ) {}

    async execute(ctx: EventContext, next: NextFunction): Promise<any> {
        if (!isHttpRequest(ctx.event)) {
            return next();
        }

        const tenantId = this.extractor.extract(ctx.event);
        if (!tenantId) {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Missing tenant ID" })
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

export const HttpTenantInitializer = HttpEventHandler.createImplementation({
    implementation: HttpTenantInitializerImpl,
    dependencies: [TenantContext, GetTenantByIdUseCase, HttpTenantIdExtractor]
});
