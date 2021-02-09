import { useCallback, useMemo } from "react";
import { useSecurity } from "@webiny/app-security";
import get from "lodash/get";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";

const usePermission = () => {
    const { identity } = useSecurity();
    const { getCurrentLocale } = useI18N();

    const currentLocale = getCurrentLocale("content");

    const hasFullAccess = useMemo(() => identity.getPermission("cms.*"), []);

    const canRead = useCallback(
        ({ contentModelGroup, contentModel, permissionName }) => {
            if (hasFullAccess) {
                return true;
            }

            const permission = identity.getPermission(permissionName);

            if (!permission) {
                return false;
            }
            if (permission.own) {
                return get(contentModel, "createdBy.id") === identity.login;
            }
            // Check "contentModel" list.
            const models = get(permission, `models.${currentLocale}`);
            if (Array.isArray(models)) {
                return models.includes(contentModel.modelId);
            }
            // Check "contentModelGroup" list.
            const groups = get(permission, `groups.${currentLocale}`);
            if (Array.isArray(groups)) {
                return groups.includes(contentModelGroup.id);
            }

            if (typeof permission.rwd === "string") {
                return permission.rwd.includes("r");
            }

            return false;
        },
        [identity, hasFullAccess, currentLocale]
    );

    const canEdit = useCallback(
        (item, permissionName) => {
            const permission = identity.getPermission(permissionName);

            if (!permission) {
                return false;
            }
            if (permission.own) {
                return get(item, "createdBy.id") === identity.login;
            }
            if (typeof permission.rwd === "string") {
                return permission.rwd.includes("w");
            }
            return true;
        },
        [identity]
    );

    const canDelete = useCallback(
        (item, permissionName) => {
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
        permissionName => {
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
        permissionName => {
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
        permissionName => {
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
        permissionName => {
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

    return {
        canRead,
        canEdit,
        canDelete,
        canPublish,
        canUnpublish,
        canRequestReview,
        canRequestChange
    };
};

export default usePermission;
