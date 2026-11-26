import { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import { TenantSwitcherSource as Abstraction } from "./abstractions.js";

/**
 * The tenants the identity has a user record in, as the API reported them at sign-in.
 */
class IdentityTenantSwitcherSourceImpl implements Abstraction.Interface {
    constructor(private identityContext: IdentityContext.Interface) {}

    async getCurrentTenant(): Promise<Abstraction.Tenant> {
        const { currentTenant } = this.identityContext.getIdentity();
        return { id: currentTenant.id, name: currentTenant.name, logo: null };
    }

    async listTenants(search?: string): Promise<Abstraction.Tenant[]> {
        const term = search?.trim().toLowerCase();

        return this.identityContext
            .getIdentity()
            .tenants.filter(tenant => !term || tenant.name.toLowerCase().includes(term))
            .map(tenant => ({ id: tenant.id, name: tenant.name, logo: null }));
    }

    canSwitch(): boolean {
        return this.identityContext.getIdentity().canSwitchTenant;
    }

    canSearch(): boolean {
        return false;
    }
}

export const IdentityTenantSwitcherSource = Abstraction.createImplementation({
    implementation: IdentityTenantSwitcherSourceImpl,
    dependencies: [IdentityContext]
});
