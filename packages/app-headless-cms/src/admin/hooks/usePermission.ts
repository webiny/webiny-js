import { useCallback, useMemo } from "react";
import { useSecurity } from "@webiny/app-security";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { CmsGroup, CmsIdentity, CmsModel, CmsSecurityPermission } from "~/types";
import { makeDecoratable } from "@webiny/react-composition";

export interface CreatableItem {
    createdBy?: Pick<CmsIdentity, "id">;
}

export type EditableItem = CreatableItem;

interface CanReadEntriesCallableParams {
    contentModelGroup: CmsGroup;
    contentModel: CmsModel;
}

export const usePermission = makeDecoratable(() => {
    const { identity, getIdentityId, getPermission, getPermissions } = useSecurity();
    const { getCurrentLocale } = useI18N();

    const currentLocale = getCurrentLocale("content");

    const hasFullAccess = useMemo(() => !!getPermission("cms.*"), [identity]);

    const canRead = useCallback(
        (permissionName: string): boolean => {
            if (hasFullAccess) {
                return true;
            }
            const permissions = getPermissions<CmsSecurityPermission>(permissionName);

            if (!permissions.length) {
                return false;
            }

            return permissions.some(permission => {
                if (typeof permission.rwd !== "string") {
                    return true;
                }

                return permission.rwd.includes("r");
            });
        },
        [identity, hasFullAccess]
    );

    const canReadEntries = useCallback(
        ({ contentModelGroup, contentModel }: CanReadEntriesCallableParams): boolean => {
            if (hasFullAccess) {
                return true;
            }

            const permissions = getPermissions<CmsSecurityPermission>("cms.contentEntry");
            if (!permissions.length) {
                return false;
            }

            // Check "contentModel" list.
            const contentModelPermissions = getPermissions("cms.contentModel");

            // "all" means user has access to all models.
            let allowedModels: "all" | string[] = [];

            for (let i = 0; i < contentModelPermissions.length; i++) {
                const permission = contentModelPermissions[i];
                const permissionAllowedModels = permission?.models?.[currentLocale!];
                // The moment we encounter a permission that gives access to all models,
                // we can stop checking other permissions.
                const allModelsAllowed = !Array.isArray(permissionAllowedModels);
                if (allModelsAllowed) {
                    allowedModels = "all";
                    break;
                }

                allowedModels = [...allowedModels, ...permissionAllowedModels];
            }

            if (Array.isArray(allowedModels)) {
                return allowedModels.includes(contentModel.modelId);
            }

            // Check "contentModelGroup" list.
            const contentModelGroupPermissions = getPermissions("cms.contentModelGroup");

            // "all" means user has access to all models.
            let allowedModelGroups: "all" | string[] = [];

            for (let i = 0; i < contentModelGroupPermissions.length; i++) {
                const permission = contentModelGroupPermissions[i];
                const permissionAllowedModelGroups = permission?.models?.[currentLocale!];
                // The moment we encounter a permission that gives access to all models,
                // we can stop checking other permissions.
                const allModelGroupsAllowed = !Array.isArray(permissionAllowedModelGroups);
                if (allModelGroupsAllowed) {
                    allowedModelGroups = "all";
                    break;
                }

                allowedModelGroups = [...allowedModelGroups, ...permissionAllowedModelGroups];
            }

            if (Array.isArray(allowedModelGroups)) {
                return allowedModelGroups.includes(contentModelGroup.id);
            }

            for (let i = 0; i < permissions.length; i++) {
                const permission = permissions[i];

                // If no RWD restrictions are set, we can return true.
                if (typeof permission.rwd !== "string") {
                    return true;
                }

                const rwdGivesReadAccess = permission.rwd.includes("r");
                if (rwdGivesReadAccess) {
                    return true;
                }
            }

            return false;
        },
        [identity, hasFullAccess, currentLocale]
    );

    const canEdit = useCallback(
        (item: CreatableItem, permissionName: string): boolean => {
            if (hasFullAccess) {
                return true;
            }

            const permissions = getPermissions<CmsSecurityPermission>(permissionName);

            if (!permissions.length || !identity) {
                return false;
            }

            return permissions.some(permission => {
                if (permission.own) {
                    /**
                     * There will be no "createdBy" field for a new entry therefore we enable the access.
                     */
                    if (!item.createdBy) {
                        return true;
                    }

                    if (item?.createdBy?.id === getIdentityId()) {
                        return true;
                    }
                }

                if (typeof permission.rwd === "string") {
                    if (permission.rwd.includes("w")) {
                        return true;
                    }
                }

                return false;
            });
        },
        [identity]
    );

    /**
     * @description This checks whether the user has the "write" access for given permission;
     * without talking the "own" property in account.
     * @param {string} permissionName
     * */
    const canCreate = useCallback(
        (permissionName: string): boolean => {
            if (hasFullAccess) {
                return true;
            }

            const permissions = getPermissions<CmsSecurityPermission>(permissionName);
            if (!permissions.length) {
                return false;
            }

            return permissions.some(permission => {
                if (typeof permission.rwd !== "string") {
                    return true;
                }

                return permission.rwd.includes("w");
            });
        },
        [identity]
    );

    const canDelete = useCallback(
        (item: CreatableItem, permissionName: string): boolean => {
            if (hasFullAccess) {
                return true;
            }

            const permissions = getPermissions<CmsSecurityPermission>(permissionName);

            if (!permissions.length) {
                return false;
            }

            return permissions.some(permission => {
                if (permission.own) {
                    // Using optional chaining here because there might be cases where the item
                    // or its `createdBy` property is not defined. In that case, we want to
                    // return `false` and not throw an error.
                    return item?.createdBy?.id === getIdentityId();
                }

                if (typeof permission.rwd === "string") {
                    return permission.rwd.includes("d");
                }

                return false;
            });
        },
        [identity]
    );

    const canDeleteEntries = useCallback(
        (permissionName: string): boolean => {
            if (hasFullAccess) {
                return true;
            }
            const permissions = getPermissions<CmsSecurityPermission>(permissionName);

            if (!permissions.length) {
                return false;
            }

            return permissions.some(permission => {
                return permission.rwd?.includes("d");
            });
        },
        [identity, hasFullAccess]
    );

    const canPublish = useCallback(
        (permissionName: string): boolean => {
            if (hasFullAccess) {
                return true;
            }
            const permissions = getPermissions<CmsSecurityPermission>(permissionName);

            if (!permissions.length) {
                return false;
            }

            return permissions.some(permission => {
                return permission.pw?.includes("p");
            });
        },
        [identity, hasFullAccess]
    );

    const canUnpublish = useCallback(
        (permissionName: string): boolean => {
            if (hasFullAccess) {
                return true;
            }
            const permissions = getPermissions<CmsSecurityPermission>(permissionName);

            if (!permissions.length) {
                return false;
            }

            return permissions.some(permission => {
                return permission.pw?.includes("u");
            });
        },
        [identity, hasFullAccess]
    );

    const canReadContentModels = canRead("cms.contentModel");
    const canReadContentModelGroups = canRead("cms.contentModelGroup");
    const canCreateContentModels = canCreate("cms.contentModel");
    const canCreateContentModelGroups = canCreate("cms.contentModelGroup");
    const canAccessManageEndpoint = useMemo(() => {
        return getPermission("cms.endpoint.manage") !== undefined;
    }, [identity]);

    return {
        canReadEntries,
        canEdit,
        canCreate,
        canDelete,
        canDeleteEntries,
        canPublish,
        canUnpublish,
        canReadContentModels,
        canReadContentModelGroups,
        canCreateContentModels,
        canCreateContentModelGroups,
        canAccessManageEndpoint
    };
});

/**
 * Default export is deprecated, use the named one.
 * @deprecated
 */
export default usePermission;
