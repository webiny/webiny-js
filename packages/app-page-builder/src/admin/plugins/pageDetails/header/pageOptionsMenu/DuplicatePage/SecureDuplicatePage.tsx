import React, { useMemo } from "react";
import { useFolders } from "@webiny/app-aco";
import { usePage } from "~/admin/views/Pages/PageDetails";
import { usePagesPermissions } from "~/hooks/permissions";
import { DuplicatePage } from "./DuplicatePage";

export const SecureDuplicatePage = DuplicatePage.createDecorator(Original => {
    return function SecurePageDetailsDuplicatePageRenderer() {
        const { page } = usePage();
        const { folderLevelPermissions: flp } = useFolders();
        const { canWrite: pagesCanWrite } = usePagesPermissions();

        const canDuplicate = useMemo(() => {
            if (!page || Object.keys(page).length === 0) {
                // Page data is not available yet
                return false;
            }

            return (
                pagesCanWrite(page.createdBy.id) &&
                flp.canManageContent(page.wbyAco_location.folderId)
            );
        }, [flp, page]);

        if (!canDuplicate) {
            return null;
        }

        return <Original />;
    };
});
