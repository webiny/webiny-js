import React from "react";
import { ReactComponent as Publish } from "@material-design-icons/svg/outlined/publish.svg";
import { ReactComponent as Unpublish } from "@material-design-icons/svg/outlined/settings_backup_restore.svg";
import { AcoConfig, useFolders } from "@webiny/app-aco";
import { usePage } from "~/admin/views/Pages/hooks/usePage";
import { useChangePageStatus } from "~/admin/views/Pages/hooks/useChangePageStatus";
import { usePagesPermissions } from "~/hooks/permissions";

export const ChangePageStatus = () => {
    const { page } = usePage();
    const { folderLevelPermissions: flp } = useFolders();
    const { openDialogUnpublishPage, openDialogPublishPage } = useChangePageStatus({ page });
    const { OptionsMenuItem } = AcoConfig.Record.Action;
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
