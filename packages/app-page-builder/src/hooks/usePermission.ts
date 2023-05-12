import { useCallback, useMemo } from "react";
import get from "lodash/get";
import { useSecurity } from "@webiny/app-security";
import { PageBuilderSecurityPermission } from "~/types";

interface CreatableItem {
    createdBy: {
        id: string;
    };
}

interface UsePermission {
    canEdit: (item: CreatableItem) => boolean;
    canDelete: (item: CreatableItem) => boolean;
    canPublish: () => boolean;
    canUnpublish: () => boolean;
}

const usePermission = (): UsePermission => {
    const { identity, getPermission } = useSecurity();

    const pbPagePermission = useMemo((): PageBuilderSecurityPermission | null => {
        return getPermission("pb.page");
    }, [identity]);
    const hasFullAccess = useMemo((): PageBuilderSecurityPermission | null => {
        return getPermission("pb.*");
    }, [identity]);

    const canEdit = useCallback(
        (item: CreatableItem): boolean => {
            if (hasFullAccess) {
                return true;
            }
            const creatorId = get(item, "createdBy.id");
            if (!pbPagePermission) {
                return false;
            }
            if (pbPagePermission.own && creatorId) {
                return !!identity && creatorId === identity.login;
            }
            if (typeof pbPagePermission.rwd === "string") {
                return pbPagePermission.rwd.includes("w");
            }
            return true;
        },
        [pbPagePermission, hasFullAccess]
    );

    const canDelete = useCallback(
        (item: CreatableItem): boolean => {
            if (hasFullAccess) {
                return true;
            }
            if (!pbPagePermission) {
                return false;
            }
            if (pbPagePermission.own) {
                const login = identity ? identity.login : null;
                return get(item, "createdBy.id", undefined) === login;
            }
            if (typeof pbPagePermission.rwd === "string") {
                return pbPagePermission.rwd.includes("d");
            }
            return true;
        },
        [pbPagePermission, hasFullAccess]
    );

    const canPublish = useCallback((): boolean => {
        if (hasFullAccess) {
            return true;
        }
        if (!pbPagePermission) {
            return false;
        }
        if (typeof pbPagePermission.pw === "string") {
            return pbPagePermission.pw.includes("p");
        }
        return false;
    }, [pbPagePermission, hasFullAccess]);

    const canUnpublish = useCallback((): boolean => {
        if (hasFullAccess) {
            return true;
        }
        if (!pbPagePermission) {
            return false;
        }
        if (typeof pbPagePermission.pw === "string") {
            return pbPagePermission.pw.includes("u");
        }
        return false;
    }, [pbPagePermission, hasFullAccess]);

    return {
        canEdit,
        canDelete,
        canPublish,
        canUnpublish
    };
};

export default usePermission;
