import React, { useMemo } from "react";
import { useFolders } from "@webiny/app-aco";
import { observer } from "mobx-react-lite";
import { PageListConfig } from "~/admin/config/pages";
import { usePagesPermissions } from "~/hooks/permissions";
import { ActionPublish as ActionPublishBase } from "~/admin/components/BulkActions";

export const SecureActionPublish = observer(() => {
    const { canPublish } = usePagesPermissions();

    const { folderLevelPermissions: flp } = useFolders();

    const { useWorker } = PageListConfig.Browser.BulkAction;
    const worker = useWorker();

    const canPublishAll = useMemo(() => {
        return worker.items.every(item => {
            return canPublish() && flp.canManageContent(item.location?.folderId);
        });
    }, [worker.items]);

    if (!canPublishAll) {
        console.log("You don't have permissions to publish pages.");
        return null;
    }

    return <ActionPublishBase />;
});
