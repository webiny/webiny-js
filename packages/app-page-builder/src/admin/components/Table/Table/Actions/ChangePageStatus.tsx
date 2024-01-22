import React from "react";
import { ReactComponent as Publish } from "@material-design-icons/svg/outlined/publish.svg";
import { ReactComponent as Unpublish } from "@material-design-icons/svg/outlined/settings_backup_restore.svg";
import { PageListConfig } from "~/admin/config/pages";
import { usePage } from "~/admin/views/Pages/hooks/usePage";
import { useChangePageStatus } from "~/admin/views/Pages/hooks/useChangePageStatus";
import { usePagesPermissions } from "~/hooks/permissions";
import { useFolders } from "@webiny/app-aco";

export const ChangePageStatus = () => {
    const { page } = usePage();
    const { openDialogUnpublishPage, openDialogPublishPage } = useChangePageStatus({ page });
    const { OptionsMenuItem } = PageListConfig.Browser.PageAction;
    const { folderLevelPermissions: flp } = useFolders();
    const { hasPermissions, canPublish, canUnpublish } = usePagesPermissions();

    if (!hasPermissions()) {
        return null;
    }

    const { folderId } = page.location;
    if (!flp.canManageContent(folderId)) {
        return null;
    }

    if (page.data.status === "published") {
        if (canUnpublish()) {
            return (
                <OptionsMenuItem
                    icon={<Unpublish />}
                    label={"Unpublish"}
                    onAction={openDialogUnpublishPage}
                    data-testid={"aco.actions.pb.page.unpublish"}
                />
            );
        }

        return null;
    }

    if (canPublish()) {
        return (
            <OptionsMenuItem
                icon={<Publish />}
                label={"Publish"}
                onAction={openDialogPublishPage}
                data-testid={"aco.actions.pb.page.publish"}
            />
        );
    }

    return null;
};
