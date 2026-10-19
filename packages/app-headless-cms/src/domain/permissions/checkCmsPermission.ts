import type { Identity } from "@webiny/app-admin/domain/Identity.js";
import type { CmsSecurityPermission } from "~/types.js";
import { hasAccessForModel } from "./hasAccessForModel.js";

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
