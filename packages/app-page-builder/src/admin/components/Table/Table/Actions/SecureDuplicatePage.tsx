import React, { useMemo } from "react";
import { useFolders } from "@webiny/app-aco";
import { createDecorator } from "@webiny/react-composition";
import { usePagesPermissions } from "~/hooks/permissions";
import { usePage } from "~/admin/views/Pages/hooks/usePage";
import { DuplicatePage } from "./DuplicatePage";

export const SecureDuplicatePage = createDecorator(DuplicatePage, Original => {
    return function SecureDuplicatePageRenderer() {
        const { page } = usePage();
        const { folderLevelPermissions: flp } = useFolders();
        const { canWrite: pagesCanWrite } = usePagesPermissions();

        const { folderId } = page.location;

        const canDuplicate = useMemo(() => {
            return pagesCanWrite(page.data.createdBy.id) && flp.canManageContent(folderId);
        }, [flp, folderId]);

        if (!canDuplicate) {
            return null;
        }

        return <Original />;
    };
});
