import React from "react";
import { ReactComponent as Publish } from "@webiny/icons/visibility.svg";
import { ReactComponent as Unpublish } from "@webiny/icons/visibility_off.svg";
import { PageListConfig } from "~/modules/pages/configs/index.js";
import { usePage } from "~/modules/pages/PagesList/hooks/usePage.js";
import { usePublishPageConfirmationDialog } from "~/modules/pages/PagesList/hooks/usePublishPageConfirmationDialog.js";
import { useUnpublishPageConfirmationDialog } from "~/modules/pages/PagesList/hooks/useUnpublishPageConfirmationDialog.js";
import { HasPermission } from "~/presentation/security/HasPermission.js";

export const ChangeStatus = () => {
    const { page } = usePage();
    const { openPublishPageConfirmationDialog } = usePublishPageConfirmationDialog({ page });
    const { openUnpublishPageConfirmationDialog } = useUnpublishPageConfirmationDialog({ page });
    const { OptionsMenuItem } = PageListConfig.Browser.Page.Action;

    if (page.status === "published") {
        return (
            <HasPermission entity={"page"} action={"unpublish"}>
                <OptionsMenuItem
                    icon={<Unpublish />}
                    label={"Unpublish"}
                    onAction={openUnpublishPageConfirmationDialog}
                />
            </HasPermission>
        );
    }

    return (
        <HasPermission entity={"page"} action={"publish"}>
            <OptionsMenuItem
                icon={<Publish />}
                label={"Publish"}
                onAction={openPublishPageConfirmationDialog}
            />
        </HasPermission>
    );
};
