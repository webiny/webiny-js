import { GroupTenantLink } from "~/types";
import { Security } from "~/Security";
import { AuthorizationPlugin } from "./AuthorizationPlugin";

export interface Config {
    identityType?: string;
}

export class GroupAuthorizationPlugin<TConfig extends Config = Config> extends AuthorizationPlugin {
    protected readonly config: TConfig;

    constructor(config?: TConfig) {
        super();
        this.config = (config || {}) as TConfig;
    }

    async getPermissions(security: Security) {
        const identity = security.getIdentity();
        const tenant = security.getTenant();

        if (!identity || identity.type !== this.config.identityType) {
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
