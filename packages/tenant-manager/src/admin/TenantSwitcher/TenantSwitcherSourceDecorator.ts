import { TenantSwitcherSource } from "@webiny/app-admin/features/tenantSwitcher/index.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/index.js";
import { FeatureFlagsService } from "@webiny/app-admin/features/featureFlags/abstractions.js";
import { ROOT_TENANT_ID } from "@webiny/app-admin/features/tenancy/rootTenant.js";
import { CurrentTenantRepository } from "../CurrentTenant/abstractions.js";
import { TenantListGateway } from "./abstractions.js";
import { isRootAdmin } from "./isRootAdmin.js";

const ROOT_TENANT: TenantSwitcherSource.Tenant = { id: ROOT_TENANT_ID, name: "Root", logo: null };

/**
 * Adds what Tenant Manager knows to the tenant switcher:
 * - the current tenant's logo, for every user (other tenants' logos only reach root admins: the
 *   identity's tenant list has none);
 * - for root admins, every tenant, Root first, with search.
 *
 * For root admins the list replaces the default one rather than adding to it: a root admin's own
 * tenant list is Root, which this list already starts with.
 */
class TenantSwitcherSourceDecoratorImpl implements TenantSwitcherSource.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private featureFlags: FeatureFlagsService.Interface,
        private currentTenantRepository: CurrentTenantRepository.Interface,
        private gateway: TenantListGateway.Interface,
        private decoratee: TenantSwitcherSource.Interface
    ) {}

    async getCurrentTenant(): Promise<TenantSwitcherSource.Tenant> {
        const current = await this.decoratee.getCurrentTenant();
        const tenant = this.currentTenantRepository.getTenant();

        if (!tenant || tenant.id !== current.id) {
            return current;
        }

        return { ...current, logo: tenant.values.logo ?? null };
    }

    async listTenants(search?: string): Promise<TenantSwitcherSource.Tenant[]> {
        if (!this.isRootAdmin()) {
            // The identity's tenants come without logos; the current tenant's is already loaded.
            const current = await this.getCurrentTenant();
            const tenants = await this.decoratee.listTenants(search);
            return tenants.map(tenant => (tenant.id === current.id ? current : tenant));
        }

        const term = search?.trim().toLowerCase();
        const tenants = await this.gateway.listTenants(term);

        const result: TenantSwitcherSource.Tenant[] = [];
        if (!term || ROOT_TENANT.name.toLowerCase().includes(term)) {
            result.push(ROOT_TENANT);
        }
        for (const tenant of tenants) {
            result.push({
                id: tenant.id,
                name: tenant.values.name,
                logo: tenant.values.logo ?? null
            });
        }

        return result;
    }

    canSwitch(): boolean {
        return this.isRootAdmin() || this.decoratee.canSwitch();
    }

    canSearch(): boolean {
        return this.isRootAdmin() || this.decoratee.canSearch();
    }

    private isRootAdmin(): boolean {
        const identity = this.identityContext.getIdentity();
        const flags = this.featureFlags.getFlags();
        const canUseMultiTenancy = flags.isEnabled("multiTenancy");
        return isRootAdmin(identity, canUseMultiTenancy);
    }
}

export const TenantSwitcherSourceDecorator = TenantSwitcherSource.createDecorator({
    decorator: TenantSwitcherSourceDecoratorImpl,
    dependencies: [IdentityContext, FeatureFlagsService, CurrentTenantRepository, TenantListGateway]
});
