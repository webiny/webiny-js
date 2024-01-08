import React from "react";
import { ReactComponent as Delete } from "@material-design-icons/svg/outlined/delete.svg";
import { AcoConfig } from "@webiny/app-aco";
import { useFileManagerApi } from "~/modules/FileManagerApiProvider/FileManagerApiContext";
import { useDeleteFile } from "~/hooks/useDeleteFile";
import { useFile } from "~/hooks/useFile";

export const DeleteFile = () => {
    const { file } = useFile();
    const { canDelete } = useFileManagerApi();
    const { openDialogDeleteFile } = useDeleteFile({
        file
    });
    const { OptionsMenuItem } = AcoConfig.Record.Action;

    if (!canDelete(file)) {
        return null;
    }

    return (
        <OptionsMenuItem
            icon={<Delete />}
            label={"Delete"}
            onAction={openDialogDeleteFile}
            data-testid={"aco.actions.file.delete"}
        />
    );
};
