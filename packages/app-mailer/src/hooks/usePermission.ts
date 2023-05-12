import { useSecurity } from "@webiny/app-security";
import { useCallback } from "react";
import { MailerSecurityPermission } from "~/types";

export const usePermission = () => {
    const { identity, getPermission } = useSecurity();

    const canChangeSettings = useCallback((): boolean => {
        const permission = getPermission<MailerSecurityPermission>("mailer.settings");
        return !!permission;
    }, [identity]);

    return {
        canChangeSettings
    };
};
