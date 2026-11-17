import isEqual from "lodash/isEqual.js";
import { minimatch } from "minimatch";
import type { IdentityContext } from "../IdentityContext/abstractions.js";
import type { SecurityPermission } from "~/types/security.js";

export interface FindNotGrantedPermissionParams {
    identityContext: IdentityContext.Interface;
    /**
     * Permissions the caller wants to store (on an API key, a role...).
     */
    requested: SecurityPermission[];
    /**
     * Permissions already stored on the record being updated.
     * A requested permission equal to one of these is not a change, so it is not checked.
     */
    existing?: SecurityPermission[];
}

/**
 * Returns the first requested permission whose name is not covered by the caller's own permissions,
 * or `null` when every requested permission is covered.
 *
 * Only permission names are compared (with wildcard support, e.g. `cms.*` covers `cms.contentEntry`).
 * Inner permission fields (`rwd`, `own`, `models`...) are not compared.
 */
export const findNotGrantedPermission = async (
    params: FindNotGrantedPermissionParams
): Promise<SecurityPermission | null> => {
    const { identityContext, requested, existing = [] } = params;

    if (!identityContext.isAuthorizationEnabled()) {
        return null;
    }

    const changed = requested.filter(permission => {
        return !existing.some(item => isEqual(item, permission));
    });
    if (changed.length === 0) {
        return null;
    }

    const callerPermissions = await identityContext.listPermissions();
    if (callerPermissions.some(permission => permission.name === "*")) {
        return null;
    }

    for (const permission of changed) {
        const isGranted = callerPermissions.some(callerPermission => {
            return (
                callerPermission.name === permission.name ||
                minimatch(permission.name, callerPermission.name)
            );
        });
        if (!isGranted) {
            return permission;
        }
    }

    return null;
};
