import type { Container } from "@webiny/di";
import { InputChainRunner, RequestContainer } from "@webiny/api-kernel-core";
import { InputTenantSource, TenantScopes } from "./abstractions.js";
import { RawTenantId, RequestTenantLoader } from "~/features/requestContext/abstractions.js";
import { TenantNotFoundError } from "~/features/requestContext/TenantNotFoundError.js";
import type { Tenant } from "~/types/tenancy.js";

const ROOT_TENANT_CLAIM: InputTenantSource.Tenant = { tenantId: null };

/**
 * Runs an event's handler chain in its tenant's scope. The `InputTenantSource` that knows the event
 * names the tenant (an event none knows runs as the root tenant), the request's tenant loader reads
 * it from the registry, and the chain is then resolved from, and runs in, that tenant's scope. The
 * request container stays tenant-neutral: no handler, and nothing a handler depends on, is built
 * there.
 */
class TenantScopeChainRunnerDecoratorImpl implements InputChainRunner.Interface {
    constructor(
        private readonly sources: InputTenantSource.Interface[],
        private readonly requestContainer: Container,
        private readonly decoratee: InputChainRunner.Interface
    ) {}

    async run(request: InputChainRunner.Request): Promise<any> {
        const claim = this.findTenant(request);
        if (claim === "tenant-neutral") {
            return this.decoratee.run(request);
        }

        // Resolved only here: a tenant-neutral event needs no API request stack at all.
        const rawTenantId = this.requestContainer.resolve(RawTenantId);
        const tenantLoader = this.requestContainer.resolve(RequestTenantLoader);
        const tenantScopes = this.requestContainer.resolve(TenantScopes);

        rawTenantId.set(claim.tenantId);
        const tenant = await this.loadTenant(claim, rawTenantId, tenantLoader);

        return tenantScopes.withTenant(tenant, async scope => {
            return this.decoratee.run({ ...request, container: scope.resolve(RequestContainer) });
        });
    }

    private findTenant(request: InputChainRunner.Request): InputTenantSource.Tenant {
        for (const source of this.sources) {
            const claim = source.getTenant(request);
            if (claim !== undefined) {
                return claim;
            }
        }
        return ROOT_TENANT_CLAIM;
    }

    private async loadTenant(
        claim: { tenantId: string | null; ifUnknown?: string },
        rawTenantId: RawTenantId.Interface,
        tenantLoader: RequestTenantLoader.Interface
    ): Promise<Tenant> {
        try {
            return await tenantLoader.establish();
        } catch (error) {
            if (claim.ifUnknown !== "root" || !(error instanceof TenantNotFoundError)) {
                throw error;
            }
        }
        rawTenantId.set(null);
        return tenantLoader.establish();
    }
}

export const TenantScopeChainRunnerDecorator = InputChainRunner.createDecorator({
    decorator: TenantScopeChainRunnerDecoratorImpl,
    dependencies: [[InputTenantSource, { multiple: true }], RequestContainer]
});
