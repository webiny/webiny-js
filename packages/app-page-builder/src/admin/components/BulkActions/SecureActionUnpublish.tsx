import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useFolders } from "@webiny/app-aco";
import { PageListConfig } from "~/admin/config/pages";
import { usePagesPermissions } from "~/hooks/permissions";
import { ActionUnpublish as ActionUnpublishBase } from "~/admin/components/BulkActions";

export const SecureActionUnpublish = observer(() => {
    const { canUnpublish } = usePagesPermissions();
    const { folderLevelPermissions: flp } = useFolders();

    const { useWorker } = PageListConfig.Browser.BulkAction;

    const worker = useWorker();

    const canUnpublishAll = useMemo(() => {
        return worker.items.every(item => {
            return canUnpublish() && flp.canManageContent(item.location?.folderId);
        });
    }, [worker.items]);

    if (!canUnpublishAll) {
        console.log("You don't have permissions to unpublish pages.");
        return null;
    }

    return <ActionUnpublishBase />;
});
