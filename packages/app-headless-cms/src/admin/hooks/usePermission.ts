import { useCallback, useMemo } from "react";
import { useSecurity } from "@webiny/app-security";
import get from "lodash/get";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { CmsIdentity, CmsGroup, CmsModel, CmsSecurityPermission } from "~/types";

interface CreatableItem {
    createdBy: Pick<CmsIdentity, "id">;
}

interface CanReadEntriesCallableParams {
    contentModelGroup: CmsGroup;
    contentModel: CmsModel;
}

export const usePermission = () => {
    const { identity, getPermission } = useSecurity();
    const { getCurrentLocale } = useI18N();

    const currentLocale = getCurrentLocale("content");

    const hasFullAccess = useMemo((): CmsSecurityPermission | null => {
        return getPermission("cms.*");
    }, [identity]);

    const canRead = useCallback(
        (permissionName: string): boolean => {
            const permission = getPermission<CmsSecurityPermission>(permissionName);

            if (hasFullAccess) {
                return true;
            }

            if (!permission) {
                return false;
            }

            if (typeof permission.rwd !== "string") {
                return true;
            }

            return permission.rwd.includes("r");
        },
        [identity, hasFullAccess]
    );

    const canReadEntries = useCallback(
        ({ contentModelGroup, contentModel }: CanReadEntriesCallableParams): boolean => {
            if (hasFullAccess) {
                return true;
            }

            const permission = getPermission<CmsSecurityPermission>("cms.contentEntry");
            const contentModelPermission = getPermission("cms.contentModel");
            const contentModelGroupPermission = getPermission("cms.contentModelGroup");

            if (!permission) {
                return false;
            }

            // Check "contentModel" list.
            const models = get(contentModelPermission, `models.${currentLocale}`);
            if (Array.isArray(models)) {
                return models.includes(contentModel.modelId);
            }
            // Check "contentModelGroup" list.
            const groups = get(contentModelGroupPermission, `groups.${currentLocale}`);
            if (Array.isArray(groups)) {
                return groups.includes(contentModelGroup.id);
            }

            if (typeof permission.rwd === "string") {
                return permission.rwd.includes("r");
            }

            return true;
        },
        [identity, hasFullAccess, currentLocale]
    );

    const canEdit = useCallback(
        (item: CreatableItem, permissionName: string): boolean => {
            const permission = getPermission<CmsSecurityPermission>(permissionName);

            if (!permission || !identity) {
                return false;
            }
            if (permission.own) {
                /**
                 * There will be no "createdBy" field for a new entry therefore we enable the access.
                 */
                if (!item.createdBy) {
                    return true;
                }
                return get(item, "createdBy.id") === identity.login;
            }
            if (typeof permission.rwd === "string") {
                return permission.rwd.includes("w");
            }
            return true;
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
            const permission = getPermission<CmsSecurityPermission>(permissionName);
            if (!permission) {
                return false;
            }

            if (typeof permission.rwd !== "string") {
                return true;
            }

            return permission.rwd.includes("w");
        },
        [identity]
    );

    const canDelete = useCallback(
        (item: CreatableItem, permissionName: string): boolean => {
            const permission = getPermission<CmsSecurityPermission>(permissionName);

            if (!permission) {
                return false;
            }
            if (permission.own) {
                return get(item, "createdBy.id") === (identity ? identity.login : null);
            }
            if (typeof permission.rwd === "string") {
                return permission.rwd.includes("d");
            }
            return true;
        },
        [identity]
    );

    const canPublish = useCallback(
        (permissionName: string): boolean => {
            if (hasFullAccess) {
                return true;
            }
            const permission = getPermission<CmsSecurityPermission>(permissionName);

            if (!permission) {
                return false;
            }
            if (typeof permission.pw === "string") {
                return permission.pw.includes("p");
            }

            return false;
        },
        [identity, hasFullAccess]
    );

    const canUnpublish = useCallback(
        (permissionName: string): boolean => {
            if (hasFullAccess) {
                return true;
            }
            const permission = getPermission<CmsSecurityPermission>(permissionName);

            if (!permission) {
                return false;
            }
            if (typeof permission.pw === "string") {
                return permission.pw.includes("u");
            }

            return false;
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
        canPublish,
        canUnpublish,
        canReadContentModels,
        canReadContentModelGroups,
        canCreateContentModels,
        canCreateContentModelGroups,
        canAccessManageEndpoint
    };
};
/**
 * Default export is deprecated, use the named one.
 * @deprecated
 */
export default usePermission;
