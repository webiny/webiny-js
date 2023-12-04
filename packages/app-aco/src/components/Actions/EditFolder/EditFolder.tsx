import React, { useCallback } from "react";
import { ReactComponent as Edit } from "@material-design-icons/svg/outlined/edit.svg";

import { AcoConfig } from "~/config";
import { useEditDialog } from "~/dialogs";
import { useFolder } from "~/hooks";

export const EditFolder = () => {
    const { folder } = useFolder();
    const { showDialog } = useEditDialog();
    const { OptionsMenuItem } = AcoConfig.Folder.Action;

    const onAction = useCallback(() => {
        showDialog({
            folder
        });
    }, [folder]);

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
