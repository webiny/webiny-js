import React from "react";
import { ReactComponent as Restore } from "@webiny/icons/restore.svg";
import { useRestoreTrashBinItem, useTrashBinItem } from "../../hooks/index.js";
import { TrashBinListConfig } from "../../configs/index.js";

export const RestoreItemAction = () => {
    const { item } = useTrashBinItem();
    const { openDialogRestoreItem } = useRestoreTrashBinItem({ item });
    const { OptionsMenuItem } = TrashBinListConfig.Browser.EntryAction;

    return (
        <OptionsMenuItem icon={<Restore />} label={"Restore"} onAction={openDialogRestoreItem} />
    );
};
