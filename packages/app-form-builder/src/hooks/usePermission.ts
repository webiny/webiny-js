import { useCallback, useMemo } from "react";
import { useSecurity } from "@webiny/app-security";
import get from "lodash/get";

const usePermission = () => {
    const { identity } = useSecurity();

    const fbFormPermission = useMemo(() => identity.getPermission("fb.form"), []);
    const hasFullAccess = useMemo(() => identity.getPermission("fb.*"), []);

    const canEdit = useCallback(
        item => {
            const creatorId = get(item, "createdBy.id");
            if (!fbFormPermission) {
                return false;
            }
            if (fbFormPermission.own && creatorId) {
                return creatorId === identity.login;
            }
            if (typeof fbFormPermission.rwd === "string") {
                return fbFormPermission.rwd.includes("w");
            }
            return true;
        },
        [fbFormPermission]
    );

    const canDelete = useCallback(
        item => {
            if (!fbFormPermission) {
                return false;
            }
            if (fbFormPermission.own) {
                return item.createdBy.id === identity.login;
            }
            if (typeof fbFormPermission.rwd === "string") {
                return fbFormPermission.rwd.includes("d");
            }
            return true;
        },
        [fbFormPermission]
    );

    const canPublish = useCallback(() => {
        if (hasFullAccess) {
            return true;
        }
        if (!fbFormPermission) {
            return false;
        }
        if (typeof fbFormPermission.pw === "string") {
            return fbFormPermission.pw.includes("p");
        }
        return fbFormPermission.pw;
    }, [fbFormPermission, hasFullAccess]);

    const canUnpublish = useCallback(() => {
        if (hasFullAccess) {
            return true;
        }
        if (!fbFormPermission) {
            return false;
        }
        if (typeof fbFormPermission.pw === "string") {
            return fbFormPermission.pw.includes("u");
        }
        return fbFormPermission.pw;
    }, [fbFormPermission, hasFullAccess]);

    return {
        canEdit,
        canDelete,
        canPublish,
        canUnpublish
    };
};

export default usePermission;
