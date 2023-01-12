import { useMemo } from "react";
import { useSecurity } from "@webiny/app-security";
import { PageBuilderSecurityPermission } from "~/types";

export const useCanCreatePage = () => {
    const { identity, getPermission } = useSecurity();

    return useMemo(() => {
        const permission = getPermission<PageBuilderSecurityPermission>("pb.page");
        if (!permission) {
            return false;
        }

        if (typeof permission.rwd !== "string") {
            return true;
        }

        return permission.rwd.includes("w");
    }, [identity]);
};
