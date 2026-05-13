import React from "react";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { FileManagerViewConfig, useFile } from "~/index.js";
import { useDeleteFile } from "~/presentation/hooks/useDeleteFile.js";
import { useFileManagerPresenter } from "~/presentation/FileList/FileManagerPresenterProvider.js";

const { FileDetails } = FileManagerViewConfig;

export const DeleteImage = () => {
    const { file } = useFile();
    const { vm, actions } = useFileManagerPresenter();
    const { openDialogDeleteFile } = useDeleteFile({
        file,
        onDelete: actions.hideFileDetails
    });

    if (!vm.permissions.canEditFile(file)) {
        return null;
    }

    return (
        <FileDetails.Action.Button
            label={"Delete"}
            onAction={openDialogDeleteFile}
            icon={<DeleteIcon />}
            data-testid={"fm-delete-file-button"}
        />
    );
};
