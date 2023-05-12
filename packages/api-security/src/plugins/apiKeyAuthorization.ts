import { SecurityContext, SecurityIdentity, SecurityPermission } from "~/types";
import { ContextPlugin } from "@webiny/api";

export interface Config {
    identityType?: string;
}

interface APIKeyIdentity extends SecurityIdentity {
    permissions: SecurityPermission[];
}

export default (config: Config) => {
    return new ContextPlugin<SecurityContext<APIKeyIdentity>>(({ security }) => {
        security.addAuthorizer(async () => {
            const identityType = config.identityType || "api-key";

            const identity = security.getIdentity<APIKeyIdentity>();

            if (!identity || identity.type !== identityType) {
                return null;
            }
            // We can expect `permissions` to exist on the identity, because api-key authentication
            // plugin sets them on the identity instance to avoid loading them from DB here.
            if (Array.isArray(identity.permissions) === false) {
                return [];
            }
            return identity.permissions as SecurityPermission[];
        });
    });
};
