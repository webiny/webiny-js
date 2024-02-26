import React, { useMemo } from "react";
import { usePagesPermissions } from "~/hooks/permissions";
import { useFolders } from "@webiny/app-aco";

import { NewRevisionFromCurrent, NewRevisionFromCurrentProps } from "./NewRevisionFromCurrent";

export const SecureNewRevisionFromCurrent = (props: NewRevisionFromCurrentProps) => {
    const { page } = props;
    const { canCreate: pagesCanCreate } = usePagesPermissions();
    const { folderLevelPermissions: flp } = useFolders();

    const hasAccess = useMemo(() => {
        return pagesCanCreate() && flp.canManageContent(page.wbyAco_location?.folderId);
    }, [page]);

    if (!hasAccess) {
        return null;
    }

    return <NewRevisionFromCurrent {...props} />;
};
