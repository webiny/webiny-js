import { useCallback, useMemo } from "react";
import { useSecurity } from "@webiny/app-security";
import get from "lodash/get";
import { FormBuilderSecurityPermission } from "~/types";

interface CreatableItem {
    createdBy?: {
        id?: string;
    };
}

export const usePermission = () => {
    const { identity, getPermission } = useSecurity();

    const fbFormPermission = useMemo((): FormBuilderSecurityPermission | null => {
        return getPermission("fb.form");
    }, [identity]);
    const hasFullAccess = useMemo((): FormBuilderSecurityPermission | null => {
        return getPermission("fb.*");
    }, [identity]);

    const canEdit = useCallback(
        (item): boolean => {
            const creatorId: string = get(item, "createdBy.id");
            if (!fbFormPermission) {
                return false;
            }
            if (fbFormPermission.own && creatorId) {
                return creatorId === (identity && identity.login);
            }
            if (typeof fbFormPermission.rwd === "string") {
                return fbFormPermission.rwd.includes("w");
            }
            return true;
        },
        [fbFormPermission]
    );

    const canDelete = useCallback(
        (item: CreatableItem): boolean => {
            if (!fbFormPermission) {
                return false;
            }
            if (fbFormPermission.own) {
                return item.createdBy?.id === (identity && identity.login);
            }
            if (typeof fbFormPermission.rwd === "string") {
                return fbFormPermission.rwd.includes("d");
            }
            return true;
        },
        [fbFormPermission]
    );

    const canPublish = useCallback((): boolean => {
        if (hasFullAccess) {
            return true;
        }
        if (!fbFormPermission) {
            return false;
        }
        if (typeof fbFormPermission.pw === "string") {
            return fbFormPermission.pw.includes("p");
        }
        return fbFormPermission.pw || false;
    }, [fbFormPermission, hasFullAccess]);

    const canUnpublish = useCallback((): boolean => {
        if (hasFullAccess) {
            return true;
        }
        if (!fbFormPermission) {
            return false;
        }
        if (typeof fbFormPermission.pw === "string") {
            return fbFormPermission.pw.includes("u");
        }
        return fbFormPermission.pw || false;
    }, [fbFormPermission, hasFullAccess]);

    return {
        canEdit,
        canDelete,
        canPublish,
        canUnpublish
    };
};
