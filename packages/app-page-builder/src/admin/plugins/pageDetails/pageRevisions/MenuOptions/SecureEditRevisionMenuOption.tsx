import React, { useMemo } from "react";
import { usePagesPermissions } from "~/hooks/permissions";
import { useFolders } from "@webiny/app-aco";

import { EditRevisionMenuOption, EditRevisionMenuOptionProps } from "./EditRevisionMenuOption";

export const SecureEditRevisionMenuOption = (props: EditRevisionMenuOptionProps) => {
    const { page } = props;
    const { canUpdate: pagesCanUpdate } = usePagesPermissions();
    const { folderLevelPermissions: flp } = useFolders();

    const hasAccess = useMemo(() => {
        return (
            pagesCanUpdate(page?.createdBy?.id) &&
            flp.canManageContent(page.wbyAco_location?.folderId)
        );
    }, [page]);

    if (!hasAccess) {
        return null;
    }

    return <EditRevisionMenuOption {...props} />;
};
