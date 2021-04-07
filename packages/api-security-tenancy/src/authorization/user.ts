import { TenancyContext } from "../types";
import { SecurityContext, SecurityPermission } from "@webiny/api-security/types";
import WebinyError from "@webiny/error";

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
            if (permissionCache.has(identity.id)) {
                return permissionCache.get(identity.id);
            }

            const user = await security.users.getUser(identity.id);

            if (!user) {
                throw WebinyError(`User "${identity.id}" was not found!`, "USER_NOT_FOUND", {
                    id: identity.id
                });
            }

            const tenant = security.getTenant();
            const permissions = await security.users.getUserAccess(user.login);
            const tenantAccess = permissions.find(set => set.tenant.id === tenant.id);
            const value = tenantAccess.group.permissions ?? null;

            permissionCache.set(identity.id, value);

            return value;
        }
    };
};
