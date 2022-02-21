import { useCallback, useMemo } from "react";
import { useSecurity } from "@webiny/app-security";
import get from "lodash/get";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { CmsCreatedBy, CmsGroup, CmsModel } from "~/types";

interface CreatableItem {
    createdBy: Pick<CmsCreatedBy, "id">;
}

interface CanReadEntriesCallableParams {
    contentModelGroup: CmsGroup;
    contentModel: CmsModel;
}

export const usePermission = () => {
    const { identity } = useSecurity();
    const { getCurrentLocale } = useI18N();

    const currentLocale = getCurrentLocale("content");

    const hasFullAccess = useMemo(() => identity.getPermission("cms.*"), []);

    const canRead = useCallback((permissionName: string) => {
        const permission = identity.getPermission(permissionName);
        if (!permission) {
            return false;
        }

        if (typeof permission.rwd !== "string") {
            return true;
        }

        return permission.rwd.includes("r");
    }, []);

    const canReadEntries = useCallback(
        ({ contentModelGroup, contentModel }: CanReadEntriesCallableParams) => {
            if (hasFullAccess) {
                return true;
            }

            const permission = identity.getPermission("cms.contentEntry");
            const contentModelPermission = identity.getPermission("cms.contentModel");
            const contentModelGroupPermission = identity.getPermission("cms.contentModelGroup");

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
            const permission = identity.getPermission(permissionName);

            if (!permission) {
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
    const canCreate = useCallback((permissionName: string): boolean => {
        const permission = identity.getPermission(permissionName);
        if (!permission) {
            return false;
        }

        if (typeof permission.rwd !== "string") {
            return true;
        }

        return permission.rwd.includes("w");
    }, []);

    const canDelete = useCallback(
        (item: CreatableItem, permissionName: string): boolean => {
            const permission = identity.getPermission(permissionName);

            if (!permission) {
                return false;
            }
            if (permission.own) {
                return get(item, "createdBy.id") === identity.login;
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
            const permission = identity.getPermission(permissionName);

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
            const permission = identity.getPermission(permissionName);

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

    const canRequestReview = useCallback(
        (permissionName: string): boolean => {
            if (hasFullAccess) {
                return true;
            }
            const permission = identity.getPermission(permissionName);

            if (!permission) {
                return false;
            }
            if (typeof permission.pw === "string") {
                return permission.pw.includes("r");
            }

            return false;
        },
        [identity, hasFullAccess]
    );

    const canRequestChange = useCallback(
        (permissionName: string): boolean => {
            if (hasFullAccess) {
                return true;
            }
            const permission = identity.getPermission(permissionName);

            if (!permission) {
                return false;
            }
            if (typeof permission.pw === "string") {
                return permission.pw.includes("c");
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
        return identity.getPermission("cms.endpoint.manage") !== undefined;
    }, [identity]);

    return {
        canReadEntries,
        canEdit,
        canCreate,
        canDelete,
        canPublish,
        canUnpublish,
        canRequestReview,
        canRequestChange,
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
