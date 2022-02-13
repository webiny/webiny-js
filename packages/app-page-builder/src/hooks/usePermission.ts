import { useCallback, useMemo } from "react";
import get from "lodash/get";
import { useSecurity } from "@webiny/app-security";
import { SecurityPermission } from "@webiny/app-security/types";

interface CreatableItem {
    createdBy: {
        id: string;
    };
}
const usePermission = () => {
    const { identity } = useSecurity();

    const pbPagePermission = useMemo(
        (): SecurityPermission => identity.getPermission("pb.page"),
        []
    );
    const hasFullAccess = useMemo((): SecurityPermission => identity.getPermission("pb.*"), []);

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
                return creatorId === identity.login;
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
                return get(item, "createdBy.id") === identity.login;
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

    const canRequestReview = useCallback((): boolean => {
        if (hasFullAccess) {
            return true;
        }
        if (!pbPagePermission) {
            return false;
        }
        if (typeof pbPagePermission.pw === "string") {
            return pbPagePermission.pw.includes("r");
        }
        return false;
    }, [pbPagePermission, hasFullAccess]);

    const canRequestChange = useCallback((): boolean => {
        if (hasFullAccess) {
            return true;
        }
        if (!pbPagePermission) {
            return false;
        }
        if (typeof pbPagePermission.pw === "string") {
            return pbPagePermission.pw.includes("c");
        }
        return false;
    }, [pbPagePermission, hasFullAccess]);

    return {
        canEdit,
        canDelete,
        canPublish,
        canUnpublish,
        canRequestReview,
        canRequestChange
    };
};

export default usePermission;
