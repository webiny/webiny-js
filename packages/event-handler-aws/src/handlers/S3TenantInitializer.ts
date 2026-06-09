import { S3EventHandler } from "../abstractions/handlers/S3EventHandler.js";
import { S3TenantIdExtractor } from "../extractors/S3TenantIdExtractor.js";
import type { IS3TenantIdExtractor } from "../extractors/S3TenantIdExtractor.js";
import type { EventContext } from "@webiny/event-handler-core";
import type { NextFunction } from "@webiny/event-handler-core";
import type { S3Event } from "@webiny/aws-sdk/types/index.js";
import { GetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import type { IGetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById/abstractions.js";
import type { ITenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";

class S3TenantInitializerImpl implements S3EventHandler.Interface {
    constructor(
        private tenantContext: ITenantContext,
        private getTenantById: IGetTenantByIdUseCase,
        private extractor: IS3TenantIdExtractor
    ) {}

    async execute(ctx: EventContext<S3Event>, next: NextFunction): Promise<any> {
        const tenantId = this.extractor.extract(ctx.event);
        if (!tenantId) {
            throw new Error("Cannot determine tenant from S3 event");
        }

        const result = await this.getTenantById.execute(tenantId);
        if (result.isFail()) {
            throw new Error(`Tenant not found: ${tenantId}`);
        }

        this.tenantContext.setTenant(result.value);
        return next();
    }
}

export const S3TenantInitializer = S3EventHandler.createImplementation({
    implementation: S3TenantInitializerImpl,
    dependencies: [TenantContext, GetTenantByIdUseCase, S3TenantIdExtractor]
});
