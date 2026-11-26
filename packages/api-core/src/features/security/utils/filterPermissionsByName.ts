import { minimatch } from "minimatch";
import type { SecurityPermission } from "~/types/security.js";

/**
 * Returns the permissions that apply to the given permission name, matched the same way
 * `IdentityContext.getPermissions()` matches them: by exact name, or by a pattern such as `cms.*`.
 */
export const filterPermissionsByName = <
    TPermission extends SecurityPermission = SecurityPermission
>(
    permissions: SecurityPermission[],
    name: string
): TPermission[] => {
    const matching = permissions.filter(permission => {
        if (permission.name === name) {
            return true;
        }
        return minimatch(name, permission.name);
    });

    return matching as TPermission[];
};
