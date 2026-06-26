import React from "react";
import { ReactComponent as MoveIcon } from "@webiny/icons/exit_to_app.svg";
import { PageListConfig } from "~/presentation/pages/PageList/configs/index.js";
import { useMovePageToFolderDialog } from "~/presentation/pages/PageList/hooks/useMovePageToFolderDialog.js";
import { usePage } from "~/presentation/pages/PageList/hooks/usePage.js";

export const Move = () => {
    const { page } = usePage();
    const { openMovePageToFolderDialog } = useMovePageToFolderDialog({ page });
    const { OptionsMenuItem } = PageListConfig.Browser.Page.Action;

    return (
        <OptionsMenuItem icon={<MoveIcon />} label={"Move"} onAction={openMovePageToFolderDialog} />
    );
};
