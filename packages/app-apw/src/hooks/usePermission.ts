import { useCallback } from "react";
import { useSecurity } from "@webiny/app-security";
import { ApwSecurityPermission } from "~/types";

export const usePermission = () => {
    const { identity, getPermission } = useSecurity();

    const canManageWorkflows = useCallback((): boolean => {
        const permission = getPermission<ApwSecurityPermission>("apw.publishingWorkflows");
        return !!permission;
    }, [identity]);

    return {
        canManageWorkflows
    };
};
