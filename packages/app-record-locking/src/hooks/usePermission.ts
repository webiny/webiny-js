import { useMemo } from "react";
import { useIdentity } from "@webiny/app-admin";

export const usePermission = () => {
    const { identity } = useIdentity();

    const canForceUnlock = useMemo(() => {
        const hasFullAccess = !!identity.getPermission("recordLocking.*");
        if (hasFullAccess) {
            return true;
        }
        const permission = identity.getPermission("recordLocking");
        return permission?.canForceUnlock === true;
    }, [identity]);

    return {
        canForceUnlock
    };
};
