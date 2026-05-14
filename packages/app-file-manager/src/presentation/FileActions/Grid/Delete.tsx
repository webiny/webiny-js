import React from "react";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { FileManagerViewConfig, useFile } from "~/index.js";
import { useFileManagerPresenter } from "~/presentation/FileList/FileManagerPresenterProvider.js";
import { useDeleteFile } from "~/presentation/hooks/useDeleteFile.js";

const { Browser } = FileManagerViewConfig;

export const Delete = () => {
    const { file } = useFile();
    const { vm } = useFileManagerPresenter();

    const { openDialogDeleteFile } = useDeleteFile({
        file,
        onDelete: close
    });

    return (
        <Browser.Grid.Item.Action.IconButton
            label={"Delete file"}
            icon={<DeleteIcon />}
            onAction={openDialogDeleteFile}
            disabled={!vm.permissions.canEditFile(file)}
        />
    );
};
