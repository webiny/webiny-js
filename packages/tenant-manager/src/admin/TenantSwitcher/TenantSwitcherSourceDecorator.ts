import { TenantSwitcherSource } from "@webiny/app-admin/features/tenantSwitcher/index.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/index.js";
import { FeatureFlagsService } from "@webiny/app-admin/features/featureFlags/abstractions.js";
import { CurrentTenantRepository } from "../CurrentTenant/abstractions.js";
import { TenantListGateway } from "./abstractions.js";
import { isRootAdmin } from "./isRootAdmin.js";

const ROOT_TENANT: TenantSwitcherSource.Tenant = { id: "root", name: "Root", logo: null };

/**
 * Adds what Tenant Manager knows to the tenant switcher:
 * - the current tenant's logo, for every user (other tenants' logos only reach root admins: the
 *   identity's tenant list has none);
 * - for root admins, every tenant, Root first, with search.
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
        const showRoot = !term || ROOT_TENANT.name.toLowerCase().includes(term);

        return [
            ...(showRoot ? [ROOT_TENANT] : []),
            ...tenants.map(tenant => ({
                id: tenant.id,
                name: tenant.values.name,
                logo: tenant.values.logo ?? null
            }))
        ];
    }

    canSwitch(): boolean {
        return this.isRootAdmin() || this.decoratee.canSwitch();
    }

    canSearch(): boolean {
        return this.isRootAdmin() || this.decoratee.canSearch();
    }

    private isRootAdmin(): boolean {
        return isRootAdmin(
            this.identityContext.getIdentity(),
            this.featureFlags.getFlags().isEnabled("multiTenancy")
        );
    }
}

export const TenantSwitcherSourceDecorator = TenantSwitcherSource.createDecorator({
    decorator: TenantSwitcherSourceDecoratorImpl,
    dependencies: [IdentityContext, FeatureFlagsService, CurrentTenantRepository, TenantListGateway]
});
