import type { SecurityContext, SecurityIdentity, SecurityPermission } from "~/types.js";
import { ContextPlugin } from "@webiny/api";

export interface Config {
    identityType?: string;
}

export default (config: Config) => {
    return new ContextPlugin<SecurityContext>(({ security }) => {
        security.addAuthorizer(async () => {
            const identityType = config.identityType || "api-key";

            const identity = security.getIdentity();

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
