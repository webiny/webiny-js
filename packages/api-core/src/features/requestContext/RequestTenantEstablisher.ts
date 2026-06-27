import { RequestTenantEstablisher as Abstraction, TenantIdExtractor } from "./abstractions.js";
import type { ITenantIdExtractor } from "./abstractions.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import type { ITenantContext } from "~/features/tenancy/TenantContext/abstractions.js";
import { GetTenantByIdUseCase } from "~/features/tenancy/GetTenantById/index.js";
import type { IGetTenantByIdUseCase } from "~/features/tenancy/GetTenantById/abstractions.js";

const DEFAULT_TENANT_ID = "root";

export class RequestTenantEstablisherImpl implements Abstraction.Interface {
    constructor(
        private tenantContext: ITenantContext,
        private getTenantById: IGetTenantByIdUseCase,
        private tenantIdExtractors: ITenantIdExtractor[]
    ) {}

    async establish(event: unknown): Promise<void> {
        let tenantId: string | null | undefined = null;
        for (const extractor of this.tenantIdExtractors) {
            const extracted = extractor.extract(event);
            if (extracted) {
                tenantId = extracted;
                break;
            }
        }

        const resolvedId = tenantId ?? DEFAULT_TENANT_ID;
        const result = await this.getTenantById.execute(resolvedId);
        if (result.isOk()) {
            this.tenantContext.setTenant(result.value);
        } else {
            console.warn(`[RequestTenantEstablisher] Tenant "${resolvedId}" not found.`);
        }
    }
}

export const RequestTenantEstablisher = Abstraction.createImplementation({
    implementation: RequestTenantEstablisherImpl,
    dependencies: [TenantContext, GetTenantByIdUseCase, [TenantIdExtractor, { multiple: true }]]
});
