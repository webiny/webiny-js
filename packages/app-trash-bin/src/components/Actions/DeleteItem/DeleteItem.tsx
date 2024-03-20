import React from "react";
import { ReactComponent as Delete } from "@material-design-icons/svg/outlined/delete.svg";
import { useDeleteTrashBinItem, useTrashBinItem } from "~/hooks";
import { TrashBinListConfig } from "~/configs";

export const DeleteItemAction = () => {
    const { item } = useTrashBinItem();
    const { openDialogDeleteItem } = useDeleteTrashBinItem({ item });
    const { OptionsMenuItem } = TrashBinListConfig.Browser.EntryAction;

    return <OptionsMenuItem icon={<Delete />} label={"Delete"} onAction={openDialogDeleteItem} />;
};
