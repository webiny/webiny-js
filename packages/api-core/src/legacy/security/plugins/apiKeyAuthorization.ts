import { createContextPlugin } from "@webiny/api";
import type { SecurityPermission } from "~/types/security.js";
import type { ApiCoreContext } from "~/types/core.js";

export interface Config {
    identityType?: string;
}

export default (config: Config) => {
    return createContextPlugin<ApiCoreContext>(({ security }) => {
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
