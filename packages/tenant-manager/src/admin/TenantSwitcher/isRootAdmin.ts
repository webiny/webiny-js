import type { Identity } from "@webiny/app-admin/domain/Identity.js";

/**
 * A user of the root tenant who manages tenants, on a license with multi-tenancy. Root admins can
 * switch to any tenant, and get "Manage tenants" in the switcher. The API applies the same rule to
 * `tenantManager.listTenants` (`TenantAccess.canList`).
 */
export const isRootAdmin = (identity: Identity, canUseMultiTenancy: boolean): boolean => {
    if (!identity.isAuthenticated || !canUseMultiTenancy || !identity.isRootUser) {
        return false;
    }

    const permission = identity.getPermission("tm.tenant");
    return Boolean(permission);
};
