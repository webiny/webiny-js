import React, { useMemo } from "react";
import { useFolders } from "@webiny/app-aco";
import { usePage } from "~/admin/views/Pages/hooks/usePage";
import { MovePage } from "./MovePage";

export const SecureMovePage = () => {
    const { page } = usePage();

    const { folderLevelPermissions: flp } = useFolders();

    const { folderId } = page.location;
    const canMove = useMemo(() => {
        return flp.canManageContent(folderId);
    }, [flp, folderId]);

    if (!canMove) {
        return null;
    }

    return <MovePage />;
};
