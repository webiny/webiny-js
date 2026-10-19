import type { Identity } from "@webiny/app-admin/domain/Identity.js";
import type { CmsSecurityPermission } from "~/types.js";

export function isModelAllowed(
    modelPermissions: CmsSecurityPermission[],
    modelId: string
): boolean {
    // No model permissions in this group means all models are allowed.
    if (!modelPermissions.length) {
        return true;
    }

    for (const permission of modelPermissions) {
        // If no models array, this permission grants access to all models.
        if (!Array.isArray(permission.models)) {
            return true;
        }

        if (permission.models.includes(modelId)) {
            return true;
        }
    }

    return false;
}

interface HasAccessParams {
    permissions: CmsSecurityPermission[];
    modelPermissions: CmsSecurityPermission[];
    modelId: string;
    check: (permission: CmsSecurityPermission) => boolean;
}

/**
 * Check if any _src group grants access for the given model.
 */
function hasAccessForModel({ permissions, modelPermissions, modelId, check }: HasAccessParams) {
    const srcKeys = new Set<string | undefined>();
    for (const p of [...permissions, ...modelPermissions]) {
        srcKeys.add(p._src);
    }

    for (const src of srcKeys) {
        const srcPerms = permissions.filter(p => p._src === src);
        const srcModelPerms = modelPermissions.filter(p => p._src === src);

        if (!srcPerms.length) {
            continue;
        }

        if (!srcPerms.some(check)) {
            continue;
        }

        const modelAllowed = isModelAllowed(srcModelPerms, modelId);
        if (!modelAllowed) {
            continue;
        }

        return true;
    }

    return false;
}

export interface CheckCmsPermissionParams {
    identity: Identity;
    /** The model the check is scoped to, through the `_src` groups; none checks without one. */
    modelId: string | undefined;
    permissionName: string;
    check: (permission: CmsSecurityPermission) => boolean;
}

/**
 * The CMS permission check of `usePermission`, for code outside React (presenters): full access,
 * else a permission named `permissionName` that passes `check`, scoped to the model when given.
 */
export const checkCmsPermission = (params: CheckCmsPermissionParams): boolean => {
    const { identity, modelId, permissionName, check } = params;
    if (identity.getPermission("cms.*")) {
        return true;
    }

    const permissions = identity.getPermissions<CmsSecurityPermission>(permissionName);
    if (!permissions.length) {
        return false;
    }

    if (modelId) {
        const modelPermissions =
            identity.getPermissions<CmsSecurityPermission>("cms.contentModel") ?? [];
        return hasAccessForModel({ permissions, modelPermissions, modelId, check });
    }

    return permissions.some(check);
};
