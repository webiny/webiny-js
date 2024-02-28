import React, { useMemo } from "react";
import { useFolders } from "@webiny/app-aco";
import { observer } from "mobx-react-lite";
import { PageListConfig } from "~/admin/config/pages";
import { usePagesPermissions } from "~/hooks/permissions";
import { ActionDuplicate } from "~/admin/components/BulkActions/ActionDuplicate";
import { createDecorator } from "@webiny/react-composition";

export const SecureActionDuplicate = createDecorator(ActionDuplicate, Original => {
    return observer(() => {
        const { canWrite: pagesCanWrite } = usePagesPermissions();
        const { folderLevelPermissions: flp } = useFolders();

        const { useWorker } = PageListConfig.Browser.BulkAction;
        const worker = useWorker();

        const canDuplicateAll = useMemo(() => {
            return worker.items.every(item => {
                return (
                    pagesCanWrite(item.data.createdBy.id) &&
                    flp.canManageContent(item.location?.folderId)
                );
            });
        }, [worker.items]);

        if (!canDuplicateAll) {
            console.log("You don't have permissions to duplicate pages.");
            return null;
        }

        return <Original />;
    });
});
