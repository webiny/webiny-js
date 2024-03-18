import React from "react";
import { ReactComponent as Delete } from "@material-design-icons/svg/outlined/delete.svg";
import { useDeleteTrashBinEntry, useTrashBinEntry } from "~/hooks";
import { TrashBinListConfig } from "~/configs";

export const DeleteEntryAction = () => {
    const { entry } = useTrashBinEntry();
    const { openDialogDeleteEntry } = useDeleteTrashBinEntry({ entry });
    const { OptionsMenuItem } = TrashBinListConfig.Browser.EntryAction;

    return <OptionsMenuItem icon={<Delete />} label={"Delete"} onAction={openDialogDeleteEntry} />;
};
