import React from "react";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { useDocument } from "~/DocumentList/hooks/useDocument.js";
import { useDeletePageConfirmationDialog } from "~/DocumentList/hooks/useDeletePageConfirmationDialog.js";
import { PageListConfig } from "~/configs/index.js";

export const Delete = () => {
    const { document } = useDocument();
    const { openUnpublishPageConfirmationDialog } = useDeletePageConfirmationDialog({
        page: document
    });
    const { OptionsMenuItem } = PageListConfig.Browser.Page.Action;

    return (
        <OptionsMenuItem
            icon={<DeleteIcon />}
            label={"Delete"}
            onAction={openUnpublishPageConfirmationDialog}
            className={"!wby-text-destructive-primary [&_svg]:wby-fill-destructive"}
        />
    );
};
