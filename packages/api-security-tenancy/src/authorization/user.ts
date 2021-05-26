import { TenancyContext, Tenant, TenantAccess } from "../types";
import { SecurityContext, SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import WebinyError from "@webiny/error";

const extractPermissions = (tenantAccess?: TenantAccess): SecurityPermission[] | null => {
    if (!tenantAccess || !tenantAccess.group || !tenantAccess.group.permissions) {
        return null;
    }
    return tenantAccess.group.permissions;
};

const createCacheKey = ({
    tenant,
    identity
}: {
    identity: SecurityIdentity;
    tenant: Tenant;
}): string => {
    return `T#${tenant.id}#I#${identity.id}`;
};

export default ({ identityType }) => {
    const permissionCache = new Map<string, SecurityPermission[] | null>();
    return {
        type: "security-authorization",
        name: "security-authorization-user",
        async getPermissions({ security }: SecurityContext & TenancyContext) {
            const identity = security.getIdentity();
            if (!identity || identity.type !== identityType) {
                return null;
            }
            const tenant = security.getTenant();
            const cacheKey = createCacheKey({
                tenant,
                identity
            });
            if (permissionCache.has(cacheKey)) {
                return permissionCache.get(cacheKey);
            }

            const user = await security.users.getUser(identity.id);

            if (!user) {
                throw new WebinyError(`User "${identity.id}" was not found!`, "USER_NOT_FOUND", {
                    id: identity.id
                });
            }

            const permissions = await security.users.getUserAccess(user.login);
            const tenantAccess = permissions.find(set => set.tenant.id === tenant.id);
            const value = extractPermissions(tenantAccess);

            permissionCache.set(cacheKey, value);

            return value;
        }
    };
};
