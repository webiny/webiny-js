import React from "react";
import { ReactComponent as MoveIcon } from "@webiny/icons/exit_to_app.svg";
import { PageListConfig } from "~/configs/index.js";
import { useMovePageToFolderDialog } from "~/modules/pages/PagesList/hooks/useMovePageToFolderDialog.js";
import { useDocument } from "~/modules/pages/PagesList/hooks/useDocument.js";

export const Move = () => {
    const { document } = useDocument();
    const { openMovePageToFolderDialog } = useMovePageToFolderDialog({ page: document });
    const { OptionsMenuItem } = PageListConfig.Browser.Page.Action;

    return (
        <OptionsMenuItem icon={<MoveIcon />} label={"Move"} onAction={openMovePageToFolderDialog} />
    );
};
