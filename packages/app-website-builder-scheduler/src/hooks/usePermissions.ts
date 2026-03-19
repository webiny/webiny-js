import { useMemo } from "react";
import { usePermissions as useWbPermissions } from "@webiny/app-website-builder/exports/admin/website-builder.js";

export const usePermissions = () => {
    const permissions = useWbPermissions();

    const canPublishPage = useMemo(() => {
        return permissions.canPublish("page");
    }, [permissions.canPublish]);

    const canUnpublishPage = useMemo(() => {
        return permissions.canUnpublish("page");
    }, [permissions.canUnpublish]);

    const canWriteRedirect = useMemo(() => {
        return permissions.canEdit("redirect");
    }, [permissions.canEdit]);

    return { canPublishPage, canUnpublishPage, canWriteRedirect };
};
