import { RequestTenantLoader as Abstraction, RawTenantId } from "./abstractions.js";
import type { IRawTenantId } from "./abstractions.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import type { ITenantContext } from "~/features/tenancy/TenantContext/abstractions.js";
import { GetTenantByIdUseCase } from "~/features/tenancy/GetTenantById/index.js";
import type { IGetTenantByIdUseCase } from "~/features/tenancy/GetTenantById/abstractions.js";

const DEFAULT_TENANT_ID = "root";

/**
 * LOAD step: reads the raw tenant id (set by the transport's EXTRACT step into RawTenantId),
 * resolves the Tenant, and sets TenantContext. Transport-agnostic.
 */
export class RequestTenantLoaderImpl implements Abstraction.Interface {
    constructor(
        private tenantContext: ITenantContext,
        private getTenantById: IGetTenantByIdUseCase,
        private rawTenantId: IRawTenantId
    ) {}

    async establish(): Promise<void> {
        const resolvedId = this.rawTenantId.get() || DEFAULT_TENANT_ID;
        const result = await this.getTenantById.execute(resolvedId);
        if (result.isOk()) {
            this.tenantContext.setTenant(result.value);
        } else {
            console.warn(`[RequestTenantLoader] Tenant "${resolvedId}" not found.`);
        }
    }
}

export const RequestTenantLoader = Abstraction.createImplementation({
    implementation: RequestTenantLoaderImpl,
    dependencies: [TenantContext, GetTenantByIdUseCase, RawTenantId]
});
