import { TenancyContext } from "../types";
import { SecurityContext, SecurityPermission } from "@webiny/api-security/types";

export default () => {
    const permissionCache = new Map<string, SecurityPermission[] | null>();
    return {
        type: "security-authorization",
        name: "security-authorization-anonymous",
        async getPermissions({ security }: SecurityContext & TenancyContext) {
            const tenant = security.getTenant();
            if (!tenant) {
                return [];
            }

            if (security.getIdentity()) {
                return;
            }

            if (permissionCache.has(tenant.id)) {
                return permissionCache.get(tenant.id);
            }

            // We assume that all other authorization plugins have already been executed.
            // If we've reached this far, it means that we have an anonymous user
            // and we need to load permissions from the "anonymous" group.
            const group = await security.groups.getGroup(tenant, "anonymous");

            const permissions = group ? group.permissions || [] : [];
            permissionCache.set(tenant.id, permissions);

            return permissions;
        }
    };
};
