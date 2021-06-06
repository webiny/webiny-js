import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { AdminUsersContext } from "../types";
import { AuthorizationPlugin } from "@webiny/api-security/plugins/AuthorizationPlugin";

export interface Config {
    identityType?: string;
}

const createCacheKey = ({ identity }: { identity: SecurityIdentity }): string => {
    return `I#${identity.id}`;
};

export class APIKeyAuthorizationPlugin extends AuthorizationPlugin<AdminUsersContext> {
    private _permissionCache = new Map<string, SecurityPermission[] | null>();
    private _config: Config;

    constructor(config?: Config) {
        super();
        this._config = config || {};
    }

    async getPermissions({ security, tenancy }: AdminUsersContext) {
        const identityType = this._config.identityType || "api-key";

        const identity = security.getIdentity();

        if (!identity || identity.type !== identityType) {
            return;
        }
        const cacheKey = createCacheKey({ identity });

        if (this._permissionCache.has(cacheKey)) {
            return this._permissionCache.get(cacheKey);
        }
        // We can expect `permissions` to exist on the identity, because api-key authentication
        // plugin sets them on the identity instance to avoid loading them from DB here.
        const permissions = Array.isArray(identity.permissions) ? identity.permissions : [];

        this._permissionCache.set(cacheKey, permissions);

        return permissions;
    }
}
