import { TenancyContext } from "@webiny/api-security-tenancy/types";
import { SecurityContext } from "@webiny/api-security/types";

export default () => ({
    type: "security-authorization",
    name: "security-authorization-anonymous",
    async getPermissions({ security }: SecurityContext & TenancyContext) {
        const tenant = security.getTenant();
        if (!tenant) {
            return [];
        }

        // We assume that all other authorization plugins have already been executed.
        // If we've reached this far, it means that we have an anonymous user
        // and we need to load permissions from the "anonymous" group.
        const group = await security.groups.getGroup(tenant, "anonymous");

        if (!group) {
            return [];
        }

        return group?.permissions;
    }
});
