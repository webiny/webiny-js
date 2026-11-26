import type { Identity } from "@webiny/app-admin/domain/Identity.js";

const ROOT_TENANT_ID = "root";

/**
 * A user of the root tenant who manages tenants, on a license with multi-tenancy. Root admins can
 * switch to any tenant, and get "Manage tenants" in the switcher.
 *
 * A root user is one with a user record in the root tenant. The default tenant alone can't tell:
 * identity providers that don't set one default to root.
 */
export const isRootAdmin = (identity: Identity, canUseMultiTenancy: boolean): boolean => {
    if (!identity.isAuthenticated || !canUseMultiTenancy) {
        return false;
    }

    const isRootUser =
        identity.tenants.length > 0
            ? identity.tenants.some(tenant => tenant.id === ROOT_TENANT_ID)
            : identity.defaultTenant.id === ROOT_TENANT_ID;

    return isRootUser && Boolean(identity.getPermission("tm.tenant"));
};
