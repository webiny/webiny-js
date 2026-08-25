import { useMemo } from "react";
import { usePermissions as useWbPermissions } from "@webiny/app-website-builder/exports/admin/website-builder.js";
import { usePermissions as useSchedulerPermissions } from "@webiny/app-scheduler/Presentation/security/usePermissions.js";

export const usePermissions = () => {
    const permissions = useWbPermissions();
    const schedulerPermissions = useSchedulerPermissions();

    const canAccessScheduler = useMemo(() => {
        return schedulerPermissions.canAccess("action");
    }, [schedulerPermissions.canAccess]);

    const canPublishPage = useMemo(() => {
        return permissions.canPublish("page");
    }, [permissions.canPublish]);

    const canUnpublishPage = useMemo(() => {
        return permissions.canUnpublish("page");
    }, [permissions.canUnpublish]);

    const canWriteRedirect = useMemo(() => {
        return permissions.canEdit("redirect");
    }, [permissions.canEdit]);

    return { canAccessScheduler, canPublishPage, canUnpublishPage, canWriteRedirect };
};
