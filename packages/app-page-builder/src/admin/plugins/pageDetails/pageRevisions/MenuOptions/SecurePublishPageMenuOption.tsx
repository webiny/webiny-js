import React, { useMemo } from "react";
import { usePagesPermissions } from "~/hooks/permissions";
import { useFolders } from "@webiny/app-aco";

import { PublishPageMenuOptionProps, PublishPageMenuOption } from "./PublishPageMenuOption";
import { usePage } from "~/admin/views/Pages/PageDetails";

export const SecurePublishPageMenuOption = (props: PublishPageMenuOptionProps) => {
    const { page } = usePage();
    const { canPublish: pagesCanPublish } = usePagesPermissions();
    const { folderLevelPermissions: flp } = useFolders();

    const hasAccess = useMemo(() => {
        return pagesCanPublish() && flp.canManageContent(page.wbyAco_location?.folderId);
    }, [page]);

    if (!hasAccess) {
        return null;
    }

    return <PublishPageMenuOption {...props} />;
};
