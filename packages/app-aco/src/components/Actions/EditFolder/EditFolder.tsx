import React, { useCallback } from "react";
import { ReactComponent as Edit } from "@material-design-icons/svg/outlined/edit.svg";

import { AcoListConfig } from "~/config";
import { useEditDialog } from "~/dialogs";
import { useFolder } from "~/hooks";

export const EditFolder = () => {
    const { folder } = useFolder();
    const { showDialog } = useEditDialog();
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
            icon={<Edit />}
            label={"Edit"}
            onAction={onAction}
            data-testid={"aco.actions.folder.edit"}
        />
    );
};
