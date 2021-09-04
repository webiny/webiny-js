import { GroupTenantLink } from "../types";
import { Security } from "../Security";
import { AuthorizationPlugin } from "./AuthorizationPlugin";

export interface Config {
    identityType?: string;
}

export class GroupAuthorizationPlugin extends AuthorizationPlugin {
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

        const tenantLink = await security.identity.getTenantLinkByIdentity<GroupTenantLink>({
            identity: identity.id,
            tenant
        });

        if (!tenantLink || !tenantLink.data.permissions) {
            return null;
        }

        return tenantLink.data.permissions;
    }
}
