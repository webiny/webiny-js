import React, { useCallback } from "react";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete.svg";

import { AcoListConfig } from "~/config";
import { useDeleteDialog } from "~/dialogs";
import { useFolder } from "~/hooks";

export const DeleteFolder = () => {
    const { folder } = useFolder();
    const { showDialog } = useDeleteDialog();
    const { OptionsMenuItem } = AcoListConfig.Folder.Action.useOptionsMenuItem();

    const onAction = useCallback(() => {
        showDialog({
            folder
        });
    }, [folder.id]);

    if (!folder) {
        return null;
    }

    return (
        <OptionsMenuItem
            icon={<DeleteIcon />}
            label={"Delete"}
            onAction={onAction}
            data-testid={"aco.actions.folder.delete"}
        />
    );
};
