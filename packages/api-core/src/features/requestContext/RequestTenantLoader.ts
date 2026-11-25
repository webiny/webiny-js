import { RequestTenantLoader as Abstraction, RawTenantId } from "./abstractions.js";
import type { IRawTenantId } from "./abstractions.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import type { ITenantContext } from "~/features/tenancy/TenantContext/abstractions.js";
import { GetTenantByIdUseCase } from "~/features/tenancy/GetTenantById/index.js";
import type { IGetTenantByIdUseCase } from "~/features/tenancy/GetTenantById/abstractions.js";
import type { Tenant } from "~/types/tenancy.js";
import { TenantNotFoundError } from "./TenantNotFoundError.js";

const DEFAULT_TENANT_ID = "root";

/**
 * A minimal in-memory root tenant used only before the system is installed, when the real root
 * tenant record doesn't exist yet. It keeps the request pipeline + GraphQL schema build functional
 * (nothing dereferences a null tenant) so the install mutation can run and create the real root.
 * Once installed, getTenantById returns the persisted record and this is never used.
 */
const createBootstrapRootTenant = (): Tenant => {
    const now = new Date().toISOString();
    return {
        id: DEFAULT_TENANT_ID,
        name: "Root",
        description: "",
        status: "enabled",
        isInstalled: false,
        settings: {
            name: { full: "Root", slug: "root" },
            social: {},
            favicon: {},
            logo: {}
        } as any,
        tags: [],
        parent: null,
        createdOn: now,
        savedOn: now
    };
};

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
            return;
        }

        // Fresh, not-yet-installed environment: the root tenant record doesn't exist yet. Establish a
        // bootstrap root so the request pipeline + GraphQL schema build work and the install mutation
        // can create the real root tenant. Only ever taken for the root tenant pre-install.
        if (resolvedId === DEFAULT_TENANT_ID) {
            this.tenantContext.setTenant(createBootstrapRootTenant());
            return;
        }

        /* Any other unknown tenant fails the request here. Carrying on with no tenant only moved the
           failure to whatever read the tenant next, and the admin login relies on this code to fall
           back to root when the tenant it remembered was deleted. */
        throw new TenantNotFoundError(resolvedId);
    }
}

export const RequestTenantLoader = Abstraction.createImplementation({
    implementation: RequestTenantLoaderImpl,
    dependencies: [TenantContext, GetTenantByIdUseCase, RawTenantId]
});
