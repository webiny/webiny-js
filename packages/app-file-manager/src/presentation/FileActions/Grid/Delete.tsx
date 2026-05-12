import React from "react";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { FileManagerViewConfig, useFile, useFileManagerApi } from "~/index.js";
import { useDeleteFile } from "~/presentation/hooks/useDeleteFile.js";

const { Browser } = FileManagerViewConfig;

export const Delete = () => {
    const { file } = useFile();
    const { canEdit } = useFileManagerApi();

    const { openDialogDeleteFile } = useDeleteFile({
        file,
        onDelete: close
    });

    return (
        <Browser.Grid.Item.Action.IconButton
            label={"Delete file"}
            icon={<DeleteIcon />}
            onAction={openDialogDeleteFile}
            disabled={!canEdit(file)}
        />
    );
};
