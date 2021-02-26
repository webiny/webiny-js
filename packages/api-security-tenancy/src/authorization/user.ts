import { TenancyContext } from "../types";
import { SecurityContext } from "@webiny/api-security/types";

export default ({ identityType }) => ({
    type: "security-authorization",
    name: "security-authorization-user",
    async getPermissions({ security }: SecurityContext & TenancyContext) {
        const identity = security.getIdentity();
        const tenant = security.getTenant();

        if (identity && identity.type === identityType) {
            // TODO: implement via DataLoader to cache User data
            const user = await security.users.getUser(identity.id);

            if (!user) {
                throw Error(`User "${identity.id}" was not found!`);
            }

            const permissions = await security.users.getUserAccess(user.login);
            const tenantAccess = permissions.find(set => set.tenant.id === tenant.id);
            return tenantAccess.group.permissions ?? null;
        }
    }
});
