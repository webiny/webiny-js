import { usePermission } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { useMemo } from "react";

export const usePermissions = () => {
    const permission = usePermission();

    const canPublish = useMemo(() => {
        return permission.canPublish("cms.contentEntry");
    }, [permission.canPublish]);

    const canUnpublish = useMemo(() => {
        return permission.canUnpublish("cms.contentEntry");
    }, [permission.canUnpublish]);

    return {
        canPublish,
        canUnpublish
    };
};
