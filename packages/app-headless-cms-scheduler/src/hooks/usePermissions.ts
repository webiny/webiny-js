import { usePermission } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { usePermissions as useSchedulerPermissions } from "@webiny/app-scheduler/Presentation/security/usePermissions.js";
import { useMemo } from "react";

export const usePermissions = () => {
    const permission = usePermission();
    const schedulerPermissions = useSchedulerPermissions();

    const canAccessScheduler = useMemo(() => {
        return schedulerPermissions.canAccess("action");
    }, [schedulerPermissions.canAccess]);

    const canPublish = useMemo(() => {
        return permission.canPublish("cms.contentEntry");
    }, [permission.canPublish]);

    const canUnpublish = useMemo(() => {
        return permission.canUnpublish("cms.contentEntry");
    }, [permission.canUnpublish]);

    return {
        canAccessScheduler,
        canPublish,
        canUnpublish
    };
};
