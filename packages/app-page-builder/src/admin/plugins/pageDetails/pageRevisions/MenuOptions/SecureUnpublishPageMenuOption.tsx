import React, { useMemo } from "react";
import { usePagesPermissions } from "~/hooks/permissions";
import { useFolders } from "@webiny/app-aco";

import { UnpublishPageMenuOption, UnpublishPageMenuOptionProps } from "./UnpublishPageMenuOption";

export const SecureUnpublishPageMenuOption = (props: UnpublishPageMenuOptionProps) => {
    const { page } = props;
    const { canUnpublish: pagesCanUnpublish } = usePagesPermissions();
    const { folderLevelPermissions: flp } = useFolders();

    const hasAccess = useMemo(() => {
        return pagesCanUnpublish() && flp.canManageContent(page.wbyAco_location?.folderId);
    }, [page]);

    if (!hasAccess) {
        return null;
    }

    return <UnpublishPageMenuOption {...props} />;
};
