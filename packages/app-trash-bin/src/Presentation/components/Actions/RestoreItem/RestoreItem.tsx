import React from "react";
import { ReactComponent as Restore } from "@material-design-icons/svg/outlined/restore.svg";
import { useRestoreTrashBinItem, useTrashBinItem } from "~/Presentation/hooks";
import { TrashBinListConfig } from "~/Presentation/configs";

export const RestoreItemAction = () => {
    const { item } = useTrashBinItem();
    const { openDialogRestoreItem } = useRestoreTrashBinItem({ item });
    const { OptionsMenuItem } = TrashBinListConfig.Browser.EntryAction;

    return (
        <OptionsMenuItem icon={<Restore />} label={"Restore"} onAction={openDialogRestoreItem} />
    );
};
