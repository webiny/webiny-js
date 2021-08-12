import { SecurityPermission } from "@webiny/api-security/types";
import { AdminUsersContext, TenantAccess } from "~/types";
import { AuthorizationPlugin } from "@webiny/api-security/plugins/AuthorizationPlugin";
import WebinyError from "@webiny/error";

export interface Config {
    identityType?: string;
}

const extractPermissions = (tenantAccess?: TenantAccess): SecurityPermission[] | null => {
    if (!tenantAccess || !tenantAccess.group || !tenantAccess.group.permissions) {
        return null;
    }
    return tenantAccess.group.permissions;
};

export class UserAuthorizationPlugin extends AuthorizationPlugin<AdminUsersContext> {
    private readonly _config: Config;

    constructor(config?: Config) {
        super();
        this._config = config || {};
    }

    async getPermissions({ security, tenancy }: AdminUsersContext) {
        const identity = security.getIdentity();
        if (!identity || identity.type !== this._config.identityType) {
            return null;
        }
        const tenant = tenancy.getCurrentTenant();

        const user = await security.users.getUser(identity.id, { auth: false });

        if (!user) {
            throw new WebinyError(`User "${identity.id}" was not found!`, "USER_NOT_FOUND", {
                id: identity.id
            });
        }

        const permissions = await security.users.getUserAccess(user.login);
        const tenantAccess = permissions.find(set => set.tenant.id === tenant.id);
        return extractPermissions(tenantAccess);
    }
}
