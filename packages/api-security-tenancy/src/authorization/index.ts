import { HandlerTenancyContext } from "@webiny/api-security-tenancy/types";
import { HandlerSecurityContext } from "@webiny/api-security/types";

export default () => ({
    type: "security-authorization",
    async getPermissions({ security }: HandlerSecurityContext & HandlerTenancyContext) {
        const identity = security.getIdentity();
        const tenant = security.getTenant();

        if (identity) {
            const user = await security.users.getUser(identity.id);

            if (!user) {
                throw Error(`User "${identity.id}" was not found!`);
            }

            const permissions = await security.users.getUserAccess(user.login);
            const tenantAccess = permissions.find(set => set.tenant.id === tenant.id);
            return tenantAccess.group.permissions ?? null;
        }

        // Identity is "anonymous", and we need to load permissions from the "anonymous" group.
        const group = await security.groups.getGroup(tenant, "anonymous");

        if (!group) {
            return [];
        }

        return group?.permissions;
    }
});
