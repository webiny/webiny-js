import { SecurityPermission } from "@webiny/api-security/types";
import { TenantAccess } from "~/types";
import { AuthorizationPlugin } from "@webiny/api-security/plugins/AuthorizationPlugin";
import WebinyError from "@webiny/error";
import { Security } from "@webiny/api-security/Security";

export interface Config {
    identityType?: string;
}

const extractPermissions = (tenantAccess?: TenantAccess): SecurityPermission[] | null => {
    if (!tenantAccess || !tenantAccess.group || !tenantAccess.group.permissions) {
        return null;
    }
    return tenantAccess.group.permissions;
};

export class IdentityAuthorizationPlugin extends AuthorizationPlugin {
    private readonly _config: Config;

    constructor(config?: Config) {
        super();
        this._config = config || {};
    }

    async getPermissions(security: Security) {
        const identity = security.getIdentity();
        const tenant = security.getTenant();

        if (!identity || identity.type !== this._config.identityType) {
            return null;
        }

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
