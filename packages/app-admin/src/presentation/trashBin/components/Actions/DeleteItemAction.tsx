import React from "react";
import { ReactComponent as Delete } from "@webiny/icons/delete.svg";
import { useDeleteTrashBinItem, useTrashBinItem } from "../../hooks/index.js";
import { TrashBinListConfig } from "../../configs/index.js";

export const DeleteItemAction = () => {
    const { item } = useTrashBinItem();
    const { openDialogDeleteItem } = useDeleteTrashBinItem({ item });
    const { OptionsMenuItem } = TrashBinListConfig.Browser.EntryAction;

    return (
        <OptionsMenuItem
            icon={<Delete />}
            label={"Delete"}
            onAction={openDialogDeleteItem}
            variant={"destructive"}
        />
    );
};
