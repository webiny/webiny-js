import { useCallback, useMemo } from "react";
import get from "lodash/get";
import { useSecurity } from "@webiny/app-security";

const usePermission = () => {
    const { identity } = useSecurity();

    const pbPagePermission = useMemo(() => identity.getPermission("pb.page"), []);
    const hasFullAccess = useMemo(() => identity.getPermission("pb.*"), []);

    const canEdit = useCallback(
        item => {
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
        [pbPagePermission]
    );

    const canDelete = useCallback(
        item => {
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
        [pbPagePermission]
    );

    const canPublish = useCallback(() => {
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

    const canUnpublish = useCallback(() => {
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

    const canRequestReview = useCallback(() => {
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

    const canRequestChange = useCallback(() => {
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
