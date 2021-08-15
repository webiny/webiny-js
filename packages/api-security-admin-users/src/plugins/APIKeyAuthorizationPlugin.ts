import { AdminUsersContext } from "~/types";
import { AuthorizationPlugin } from "@webiny/api-security/plugins/AuthorizationPlugin";

export interface Config {
    identityType?: string;
}

export class APIKeyAuthorizationPlugin extends AuthorizationPlugin<AdminUsersContext> {
    private _config: Config;

    constructor(config?: Config) {
        super();
        this._config = config || {};
    }

    async getPermissions({ security }: AdminUsersContext) {
        const identityType = this._config.identityType || "api-key";

        const identity = security.getIdentity();

        if (!identity || identity.type !== identityType) {
            return;
        }

        // We can expect `permissions` to exist on the identity, because api-key authentication
        // plugin sets them on the identity instance to avoid loading them from DB here.
        return Array.isArray(identity.permissions) ? identity.permissions : [];
    }
}
