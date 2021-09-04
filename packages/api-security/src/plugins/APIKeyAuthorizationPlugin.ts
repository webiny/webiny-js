import { AuthorizationPlugin } from "./AuthorizationPlugin";
import { Security } from "../Security";
import { SecurityIdentity, SecurityPermission } from "../types";

export interface Config {
    identityType?: string;
}

interface APIKeyIdentity extends SecurityIdentity {
    permissions: SecurityPermission[];
}

export class APIKeyAuthorizationPlugin extends AuthorizationPlugin {
    private _config: Config;

    constructor(config?: Config) {
        super();
        this._config = config || {};
    }

    async getPermissions(security: Security) {
        const identityType = this._config.identityType || "api-key";

        const identity = security.getIdentity<APIKeyIdentity>();

        if (!identity || identity.type !== identityType) {
            return;
        }

        // We can expect `permissions` to exist on the identity, because api-key authentication
        // plugin sets them on the identity instance to avoid loading them from DB here.
        return Array.isArray(identity.permissions) ? identity.permissions : [];
    }
}
