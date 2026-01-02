import { useSecurity } from "@webiny/app-admin";
import { useCallback } from "react";
import type { MailerSecurityPermission } from "~/types.js";

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
