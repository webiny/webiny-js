import React, { useMemo } from "react";
import { useFolders } from "@webiny/app-aco";
import { createDecorator } from "@webiny/react-composition";
import { usePage } from "~/admin/views/Pages/PageDetails";
import { usePagesPermissions } from "~/hooks/permissions";
import { DuplicatePage } from "./DuplicatePage";

export const SecureDuplicatePage = createDecorator(DuplicatePage, Original => {
    return function SecurePageDetailsDuplicatePageRenderer() {
        const { page } = usePage();
        const { folderLevelPermissions: flp } = useFolders();
        const { canWrite: pagesCanWrite } = usePagesPermissions();

        const { folderId } = page.wbyAco_location;

        const canDuplicate = useMemo(() => {
            return pagesCanWrite(page.createdBy.id) && flp.canManageContent(folderId);
        }, [flp, folderId]);

        if (!canDuplicate) {
            return null;
        }

        return <Original />;
    };
});
