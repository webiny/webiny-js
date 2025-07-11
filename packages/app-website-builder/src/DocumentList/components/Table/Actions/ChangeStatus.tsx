import React from "react";
import { ReactComponent as Publish } from "@webiny/icons/visibility.svg";
import { ReactComponent as Unpublish } from "@webiny/icons/visibility_off.svg";
import { PageListConfig } from "~/configs/index.js";
import { useDocument } from "~/DocumentList/hooks/useDocument.js";
import { usePublishPageConfirmationDialog } from "~/DocumentList/hooks/usePublishPageConfirmationDialog.js";
import { useUnpublishPageConfirmationDialog } from "~/DocumentList/hooks/useUnpublishPageConfirmationDialog.js";

export const ChangeStatus = () => {
    const { document } = useDocument();
    const { openPublishPageConfirmationDialog } = usePublishPageConfirmationDialog({
        page: document
    });
    const { openUnpublishPageConfirmationDialog } = useUnpublishPageConfirmationDialog({
        page: document
    });
    const { OptionsMenuItem } = PageListConfig.Browser.Page.Action;

    if (document.data.status === "published") {
        return (
            <OptionsMenuItem
                icon={<Unpublish />}
                label={"Unpublish"}
                onAction={openUnpublishPageConfirmationDialog}
            />
        );
    }

    return (
        <OptionsMenuItem
            icon={<Publish />}
            label={"Publish"}
            onAction={openPublishPageConfirmationDialog}
        />
    );
};
