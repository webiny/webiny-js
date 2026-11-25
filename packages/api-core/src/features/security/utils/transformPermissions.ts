import type { SecurityPermission } from "~/types/security.js";
import type { PermissionTransformer } from "../authorization/AuthorizationContext/abstractions.js";

const deduplicatePermissions = (permissions: SecurityPermission[]) => {
    const seen = new Set<string>();

    return permissions.filter(permission => {
        const key = JSON.stringify(permission);
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
};

/**
 * Runs the permission transformers over the permissions an authorizer returned, then removes
 * duplicates. A transformer can return one or more permissions for each permission it gets.
 */
export const transformPermissions = (
    permissions: SecurityPermission[],
    transformers: PermissionTransformer.Interface[]
) => {
    if (transformers.length === 0) {
        return deduplicatePermissions(permissions);
    }

    const transformed = permissions.flatMap(permission => {
        return transformers.flatMap(transformer => transformer.execute(permission));
    });

    return deduplicatePermissions(transformed);
};
