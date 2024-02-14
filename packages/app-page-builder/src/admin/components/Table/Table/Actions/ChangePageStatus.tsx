import React from "react";
import { ReactComponent as Publish } from "@material-design-icons/svg/outlined/publish.svg";
import { ReactComponent as Unpublish } from "@material-design-icons/svg/outlined/settings_backup_restore.svg";
import { PageListConfig } from "~/admin/config/pages";
import { usePage } from "~/admin/views/Pages/hooks/usePage";
import { useChangePageStatus } from "~/admin/views/Pages/hooks/useChangePageStatus";
import { makeDecoratable } from "@webiny/react-composition";

export const ChangePageStatus = makeDecoratable("ChangePageStatus", () => {
    const { page } = usePage();
    const { openDialogUnpublishPage, openDialogPublishPage } = useChangePageStatus({ page });
    const { OptionsMenuItem } = PageListConfig.Browser.PageAction;

    if (page.data.status === "published") {
        return (
            <OptionsMenuItem
                icon={<Unpublish />}
                label={"Unpublish"}
                onAction={openDialogUnpublishPage}
                data-testid={"aco.actions.pb.page.unpublish"}
            />
        );
    }

    return (
        <OptionsMenuItem
            icon={<Publish />}
            label={"Publish"}
            onAction={openDialogPublishPage}
            data-testid={"aco.actions.pb.page.publish"}
        />
    );
});
