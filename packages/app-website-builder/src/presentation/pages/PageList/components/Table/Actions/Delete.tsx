import React from "react";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { usePage } from "~/presentation/pages/PageList/hooks/usePage.js";
import { useDeletePageConfirmationDialog } from "~/presentation/pages/PageList/hooks/useDeletePageConfirmationDialog.js";
import { PageListConfig } from "~/presentation/pages/PageList/configs/index.js";

export const Delete = () => {
    const { page } = usePage();
    const { openDeletePageConfirmationDialog } = useDeletePageConfirmationDialog({ page });
    const { OptionsMenuItem } = PageListConfig.Browser.Page.Action;

    return (
        <OptionsMenuItem
            icon={<DeleteIcon />}
            label={"Trash"}
            onAction={openDeletePageConfirmationDialog}
            variant={"destructive"}
        />
    );
};
