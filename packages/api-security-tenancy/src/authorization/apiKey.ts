import { TenancyContext } from "@webiny/api-security-tenancy/types";
import { SecurityAuthorizationPlugin, SecurityContext } from "@webiny/api-security/types";

type APIKeyAuthorization = {
    identityType?: string;
};

export default (config: APIKeyAuthorization = {}): SecurityAuthorizationPlugin => ({
    type: "security-authorization",
    async getPermissions({ security }: SecurityContext & TenancyContext) {
        const identityType = config.identityType || "api-key";

        const identity = security.getIdentity();

        if (identity && identity.type === identityType) {
            // We can expect `permissions` to exist on the identity, because api-key authentication
            // plugin sets them on the identity instance to avoid loading them from DB here.
            return Array.isArray(identity.permissions) ? identity.permissions : [];
        }
    }
});
