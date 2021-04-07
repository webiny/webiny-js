import { SecurityAuthorizationPlugin, SecurityPermission } from "@webiny/api-security/types";

type APIKeyAuthorization = {
    identityType?: string;
};

export default (config: APIKeyAuthorization = {}): SecurityAuthorizationPlugin => {
    const permissionCache = new Map<string, SecurityPermission[] | null>();
    return {
        type: "security-authorization",
        name: "security-authorization-api-key",
        async getPermissions({ security }) {
            const identityType = config.identityType || "api-key";

            const identity = security.getIdentity();

            if (!identity || identity.type !== identityType) {
                return;
            }
            if (permissionCache.has(identity.id)) {
                return permissionCache.get(identity.id);
            }
            // We can expect `permissions` to exist on the identity, because api-key authentication
            // plugin sets them on the identity instance to avoid loading them from DB here.
            const permissions = Array.isArray(identity.permissions) ? identity.permissions : [];

            permissionCache.set(identity.id, permissions);

            return permissions;
        }
    };
};
