import { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import { ROOT_TENANT_ID } from "~/features/tenancy/rootTenant.js";
import { TenantSwitcherSource as Abstraction } from "./abstractions.js";

const ROOT_TENANT: Abstraction.Tenant = { id: ROOT_TENANT_ID, name: "Root", logo: null };

/**
 * The tenants the identity has a user record in, as the API reported them at sign-in. A root user
 * who ended up in another tenant (a `?tenantId=` link, a tenant left in local storage) also gets
 * that tenant and Root, so there is always a way back.
 */
class IdentityTenantSwitcherSourceImpl implements Abstraction.Interface {
    constructor(private identityContext: IdentityContext.Interface) {}

    async getCurrentTenant(): Promise<Abstraction.Tenant> {
        const { currentTenant } = this.identityContext.getIdentity();
        return { id: currentTenant.id, name: currentTenant.name, logo: null };
    }

    async listTenants(search?: string): Promise<Abstraction.Tenant[]> {
        const term = search?.trim().toLowerCase();
        const tenants = this.listOwnTenants();

        return tenants.filter(tenant => !term || tenant.name.toLowerCase().includes(term));
    }

    canSwitch(): boolean {
        const identity = this.identityContext.getIdentity();
        return identity.canSwitchTenant || this.isRootUserOutsideRoot();
    }

    canSearch(): boolean {
        return false;
    }

    private listOwnTenants(): Abstraction.Tenant[] {
        const identity = this.identityContext.getIdentity();

        if (this.isRootUserOutsideRoot()) {
            const current = identity.currentTenant;
            return [ROOT_TENANT, { id: current.id, name: current.name, logo: null }];
        }

        return identity.tenants.map(tenant => ({ id: tenant.id, name: tenant.name, logo: null }));
    }

    private isRootUserOutsideRoot(): boolean {
        const identity = this.identityContext.getIdentity();
        if (!identity.isAuthenticated || !identity.isRootUser) {
            return false;
        }

        return identity.currentTenant.id !== ROOT_TENANT_ID;
    }
}

export const IdentityTenantSwitcherSource = Abstraction.createImplementation({
    implementation: IdentityTenantSwitcherSourceImpl,
    dependencies: [IdentityContext]
});
