import React, { useMemo } from "react";
import { useFolders } from "@webiny/app-aco";
import { observer } from "mobx-react-lite";
import { PageListConfig } from "~/admin/config/pages";
import { ActionMove as ActionMoveBase } from "~/admin/components/BulkActions";

export const ActionMove = observer(() => {
    const { useWorker } = PageListConfig.Browser.BulkAction;
    const worker = useWorker();
    const { folderLevelPermissions: flp } = useFolders();

    const canMoveAll = useMemo(() => {
        return worker.items.every(item => {
            return flp.canManageContent(item.location?.folderId);
        });
    }, [worker.items]);

    if (!canMoveAll) {
        return null;
    }

    return <ActionMoveBase />;
});
